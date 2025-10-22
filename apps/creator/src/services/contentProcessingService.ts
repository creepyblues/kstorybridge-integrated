import { embeddingService } from './embeddingService';
import { titlesService, type Title } from './titlesService';

interface ProcessingStatus {
  total: number;
  processed: number;
  failed: number;
  inProgress: boolean;
  errors: string[];
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

interface ProcessingOptions {
  batchSize?: number;
  delay?: number;
  dryRun?: boolean;
  limitToTitles?: string[];
  force?: boolean; // Process even if embeddings exist
}

class ContentProcessingService {
  private processingStatus: ProcessingStatus = {
    total: 0,
    processed: 0,
    failed: 0,
    inProgress: false,
    errors: [],
  };

  private abortController?: AbortController;

  async getProcessingStatus(): Promise<ProcessingStatus> {
    return { ...this.processingStatus };
  }

  async checkEmbeddingServiceStatus(): Promise<{
    configured: boolean;
    vectorSearchEnabled: boolean;
    totalTitles: number;
    titlesWithEmbeddings: number;
    titlesNeedingProcessing: number;
  }> {
    try {
      const isConfigured = embeddingService.isConfigured();
      
      if (!isConfigured) {
        return {
          configured: false,
          vectorSearchEnabled: false,
          totalTitles: 0,
          titlesWithEmbeddings: 0,
          titlesNeedingProcessing: 0,
        };
      }

      const status = await embeddingService.getProcessingStatus();
      
      return {
        configured: true,
        vectorSearchEnabled: status.total_titles > 0,
        totalTitles: status.total_titles,
        titlesWithEmbeddings: status.with_embeddings,
        titlesNeedingProcessing: status.needs_processing.length,
      };
    } catch (error) {
      console.error('Error checking embedding service status:', error);
      return {
        configured: false,
        vectorSearchEnabled: false,
        totalTitles: 0,
        titlesWithEmbeddings: 0,
        titlesNeedingProcessing: 0,
      };
    }
  }

  async processAllTitles(options: ProcessingOptions = {}): Promise<ProcessingStatus> {
    if (this.processingStatus.inProgress) {
      throw new Error('Processing is already in progress');
    }

    // Check if embedding service is configured
    if (!embeddingService.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment.');
    }

    const {
      batchSize = 5,
      delay = 2000,
      dryRun = false,
      limitToTitles,
      force = false
    } = options;

    console.log(`🚀 Starting content processing pipeline${dryRun ? ' (DRY RUN)' : ''}`);

    // Initialize status
    this.processingStatus = {
      total: 0,
      processed: 0,
      failed: 0,
      inProgress: true,
      errors: [],
      startTime: new Date(),
    };

    this.abortController = new AbortController();

    try {
      // Get titles to process
      let titlesToProcess: Title[];
      
      if (limitToTitles && limitToTitles.length > 0) {
        console.log(`📋 Processing specific titles: ${limitToTitles.length} titles`);
        const allTitles = await titlesService.getAllTitles();
        titlesToProcess = allTitles.filter(title => limitToTitles.includes(title.title_id));
      } else if (!force) {
        // Only process titles without embeddings
        console.log('🔍 Checking which titles need processing...');
        const processingStatus = await embeddingService.getProcessingStatus();
        const allTitles = await titlesService.getAllTitles();
        titlesToProcess = allTitles.filter(title => 
          processingStatus.needs_processing.includes(title.title_id)
        );
        console.log(`📊 Found ${titlesToProcess.length} titles needing processing out of ${allTitles.length} total`);
      } else {
        // Process all titles (force mode)
        console.log('🔄 Force processing all titles...');
        titlesToProcess = await titlesService.getAllTitles();
      }

      this.processingStatus.total = titlesToProcess.length;

      if (titlesToProcess.length === 0) {
        console.log('✅ No titles need processing');
        this.processingStatus.inProgress = false;
        return this.processingStatus;
      }

      if (dryRun) {
        console.log(`🧪 DRY RUN: Would process ${titlesToProcess.length} titles`);
        titlesToProcess.slice(0, 3).forEach((title, idx) => {
          console.log(`   ${idx + 1}. ${title.title_name_en || title.title_name_kr} (${title.title_id})`);
        });
        if (titlesToProcess.length > 3) {
          console.log(`   ... and ${titlesToProcess.length - 3} more`);
        }
        this.processingStatus.inProgress = false;
        return this.processingStatus;
      }

      // Process in batches
      for (let i = 0; i < titlesToProcess.length; i += batchSize) {
        if (this.abortController.signal.aborted) {
          console.log('⏹️ Processing aborted by user');
          break;
        }

        const batch = titlesToProcess.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(titlesToProcess.length / batchSize);

        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} titles)`);

        // Process batch in parallel
        const batchPromises = batch.map(async (title) => {
          try {
            console.log(`   🔄 Processing: ${title.title_name_en || title.title_name_kr}`);
            const success = await embeddingService.processTitle(title);
            
            if (success) {
              this.processingStatus.processed++;
              console.log(`   ✅ Completed: ${title.title_name_en || title.title_name_kr}`);
            } else {
              this.processingStatus.failed++;
              this.processingStatus.errors.push(`Failed to process: ${title.title_id}`);
              console.log(`   ❌ Failed: ${title.title_name_en || title.title_name_kr}`);
            }
          } catch (error: any) {
            this.processingStatus.failed++;
            this.processingStatus.errors.push(`Error processing ${title.title_id}: ${error.message}`);
            console.error(`   ❌ Error processing ${title.title_name_en || title.title_name_kr}:`, error);
          }
        });

        await Promise.all(batchPromises);

        // Update estimated time remaining
        if (this.processingStatus.startTime) {
          const elapsed = Date.now() - this.processingStatus.startTime.getTime();
          const processed = this.processingStatus.processed + this.processingStatus.failed;
          const remaining = this.processingStatus.total - processed;
          
          if (processed > 0) {
            this.processingStatus.estimatedTimeRemaining = Math.round((elapsed / processed) * remaining);
          }
        }

        console.log(`📊 Progress: ${this.processingStatus.processed}/${this.processingStatus.total} processed, ${this.processingStatus.failed} failed`);

        // Delay between batches (except for the last batch)
        if (i + batchSize < titlesToProcess.length && delay > 0) {
          console.log(`⏳ Waiting ${delay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      const duration = this.processingStatus.startTime 
        ? Date.now() - this.processingStatus.startTime.getTime()
        : 0;

      console.log(`🎉 Processing completed in ${Math.round(duration / 1000)}s`);
      console.log(`📈 Results: ${this.processingStatus.processed} processed, ${this.processingStatus.failed} failed`);
      
      if (this.processingStatus.errors.length > 0) {
        console.log(`❌ Errors:`);
        this.processingStatus.errors.forEach(error => console.log(`   ${error}`));
      }

    } catch (error: any) {
      console.error('❌ Processing pipeline failed:', error);
      this.processingStatus.errors.push(`Pipeline error: ${error.message}`);
      this.processingStatus.failed = this.processingStatus.total - this.processingStatus.processed;
    } finally {
      this.processingStatus.inProgress = false;
      this.abortController = undefined;
    }

    return this.processingStatus;
  }

  async processSingleTitle(titleId: string): Promise<boolean> {
    try {
      console.log(`🔄 Processing single title: ${titleId}`);
      
      const title = await titlesService.getTitleById(titleId);
      if (!title) {
        throw new Error(`Title not found: ${titleId}`);
      }

      const success = await embeddingService.processTitle(title);
      
      if (success) {
        console.log(`✅ Successfully processed: ${title.title_name_en || title.title_name_kr}`);
      } else {
        console.log(`❌ Failed to process: ${title.title_name_en || title.title_name_kr}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ Error processing title ${titleId}:`, error);
      return false;
    }
  }

  async reprocessFailedTitles(): Promise<ProcessingStatus> {
    if (this.processingStatus.errors.length === 0) {
      throw new Error('No failed titles to reprocess');
    }

    console.log(`🔄 Reprocessing ${this.processingStatus.errors.length} failed titles`);
    
    // Extract title IDs from error messages
    const failedTitleIds = this.processingStatus.errors
      .map(error => {
        const match = error.match(/Failed to process: (.+)/) || error.match(/Error processing (.+):/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (failedTitleIds.length === 0) {
      throw new Error('Could not extract title IDs from error messages');
    }

    return this.processAllTitles({
      limitToTitles: failedTitleIds,
      force: true
    });
  }

  abortProcessing(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Processing abort requested');
    }
  }

  async validateEmbeddings(): Promise<{
    totalTitles: number;
    withEmbeddings: number;
    missingEmbeddings: string[];
    corruptedEmbeddings: string[];
  }> {
    try {
      console.log('🔍 Validating embeddings...');
      
      const allTitles = await titlesService.getAllTitles();
      const withEmbeddings: string[] = [];
      const missingEmbeddings: string[] = [];
      const corruptedEmbeddings: string[] = [];

      // This would need to be implemented to check the database
      // For now, use the embedding service status
      const status = await embeddingService.getProcessingStatus();
      
      return {
        totalTitles: status.total_titles,
        withEmbeddings: status.with_embeddings,
        missingEmbeddings: status.needs_processing,
        corruptedEmbeddings: [] // Would need database query to check
      };
    } catch (error) {
      console.error('Error validating embeddings:', error);
      throw error;
    }
  }

  async getRecommendedBatchSize(): Promise<number> {
    // Analyze system and rate limits to recommend optimal batch size
    const status = await embeddingService.getProcessingStatus();
    
    if (status.needs_processing.length < 10) {
      return 2; // Small batches for few items
    } else if (status.needs_processing.length < 100) {
      return 5; // Medium batches
    } else {
      return 3; // Conservative for large datasets
    }
  }

  getDetailedStatus(): {
    status: ProcessingStatus;
    embeddingServiceConfigured: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (!embeddingService.isConfigured()) {
      recommendations.push('Configure OpenAI API key to enable vector search');
    }

    if (this.processingStatus.failed > 0) {
      recommendations.push(`${this.processingStatus.failed} titles failed processing - consider reprocessing`);
    }

    if (this.processingStatus.inProgress) {
      recommendations.push('Processing in progress - avoid starting additional processing');
    }

    return {
      status: this.processingStatus,
      embeddingServiceConfigured: embeddingService.isConfigured(),
      recommendations
    };
  }
}

export const contentProcessingService = new ContentProcessingService();