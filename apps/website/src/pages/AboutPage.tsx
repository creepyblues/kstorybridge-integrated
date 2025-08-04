import PageHeader from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { ExternalLink } from 'lucide-react';
import Footer from '../components/Footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink mb-6">
                About KStoryBridge
              </h1>
              <p className="text-xl lg:text-2xl text-midnight-ink-600 mb-12">
                Connecting Korean content creators with global entertainment buyers
              </p>
            </div>
          </div>
        </section>

        {/* What is KStoryBridge Section */}
        <section className="py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-center text-midnight-ink mb-16">
                What is KStoryBridge?
              </h2>
              
              <div className="space-y-8 text-midnight-ink-600">
                <p className="text-xl leading-relaxed">
                  KStoryBridge is a revolutionary platform that connects Korean content creators with global entertainment buyers, streamlining the process of discovering and licensing premium Korean content.
                </p>
                
                <p className="text-lg leading-relaxed">
                  Our platform serves as the bridge between the vibrant Korean content creation ecosystem and international markets hungry for fresh, innovative storytelling. We specialize in webtoons, web novels, light novels, games, manhwa, and other Korean digital content that has proven audience engagement.
                </p>
                
                <p className="text-lg leading-relaxed">
                  Through our AI-powered verification system and comprehensive analytics, we help creators showcase their work professionally while providing buyers with the insights they need to make informed licensing decisions. Our goal is to make the IP licensing process transparent, efficient, and accessible to creators and buyers worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-center text-midnight-ink mb-16">
                Who's Behind KStoryBridge?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12">
                {/* Kevin Nicklaus */}
                <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-midnight-ink mb-4">Kevin Nicklaus</h3>
                      
                      <a 
                        href="https://www.linkedin.com/in/kevin-nicklaus/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-hanok-teal hover:text-hanok-teal-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        LinkedIn Profile
                      </a>
                    </div>
                    <div className="text-left space-y-4 text-midnight-ink-600">
                      <p className="leading-relaxed">
                        Kevin Nicklaus brings 20+ years of experience in global content development, production, and talent management, making him uniquely suited to lead cross-cultural storytelling initiatives. He's led cross-border projects with RIDI and Manta, including the global adaptation of Korean webtoons like The Beginning After the End. As co-founder of Sandstone Artists and former executive at major studios, he bridges Hollywood and Korean creators with deep industry insight and a strong creative vision. His track record in IP development, localization, and global partnerships makes him uniquely equipped to connect Korean stories with the world.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sungho Lee */}
                <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-midnight-ink mb-4">Sungho Lee</h3>
                      
                      <a 
                        href="https://www.linkedin.com/in/sungholee/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-hanok-teal hover:text-hanok-teal-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        LinkedIn Profile
                      </a>
                    </div>
                    <div className="text-left space-y-4 text-midnight-ink-600">
                      <p className="leading-relaxed">
                        Sungho combines deep expertise in global partnerships, content licensing, and go-to-market strategy, making him uniquely equipped to lead KStoryBridge. At RIDI, he secured Hollywood adaptation deals, launched bestselling print titles like Under The Oak Tree, and led game and media partnerships. His past roles at Netflix and LG saw him drive international growth through innovative deals across APAC and global product launches. With startup experience as a founder and fractional GTM advisor, Sungho brings both strategic vision and executional rigor to connect Korean creators with global opportunities.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-20 bg-gradient-to-r from-hanok-teal to-porcelain-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8">
                Our Mission
              </h2>
              <p className="text-xl leading-relaxed">
                To empower Korean content creators by providing them with a global platform to showcase their work, 
                while helping international buyers discover the next generation of compelling stories that will captivate audiences worldwide.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutPage;