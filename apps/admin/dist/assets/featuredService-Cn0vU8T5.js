import{s as a}from"./index-DZDudrgO.js";const o={async getMostRecentFeatured(){const{data:t,error:e}=await a.from("featured").select(`
        *,
        titles (*)
      `).order("created_at",{ascending:!1}).limit(1).single();if(e){if(e.code==="PGRST116")return null;throw new Error(`Failed to fetch most recent featured title: ${e.message}`)}return t},async getFeaturedByViews(t=5){const{data:e,error:r}=await a.from("featured").select(`
        *,
        titles (*)
      `).order("titles(views)",{ascending:!1}).limit(t);if(r)throw new Error(`Failed to fetch featured titles by views: ${r.message}`);return e||[]},async getAllFeatured(){const{data:t,error:e}=await a.from("featured").select(`
        *,
        titles (*)
      `).order("created_at",{ascending:!1});if(e)throw new Error(`Failed to fetch all featured titles: ${e.message}`);return t||[]},async getFeaturedTitles(){const{data:t,error:e}=await a.from("featured").select(`
        *,
        titles (
          title_id,
          title_name_en,
          title_name_kr,
          title_image,
          tagline,
          genre,
          content_format,
          story_author,
          pitch
        )
      `).order("created_at",{ascending:!1});if(e)throw new Error(`Failed to fetch featured titles: ${e.message}`);return t||[]},async addFeaturedTitle(t,e){const{data:r,error:i}=await a.from("featured").insert({title_id:t,note:e||null}).select().single();if(i)throw new Error(`Failed to add featured title: ${i.message}`);return r},async removeFeaturedTitle(t){const{error:e}=await a.from("featured").delete().eq("id",t);if(e)throw new Error(`Failed to remove featured title: ${e.message}`)},async updateFeaturedNote(t,e){const{data:r,error:i}=await a.from("featured").update({note:e,updated_at:new Date().toISOString()}).eq("id",t).select().single();if(i)throw new Error(`Failed to update featured title note: ${i.message}`);return r},async isTitleFeatured(t){const{data:e,error:r}=await a.from("featured").select("id").eq("title_id",t).limit(1);if(r)throw new Error(`Failed to check if title is featured: ${r.message}`);return e&&e.length>0||!1}};export{o as f};
