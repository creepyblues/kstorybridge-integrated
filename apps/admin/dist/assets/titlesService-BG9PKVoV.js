import{s as i}from"./index-DFcxXomF.js";const l={async getAllTitles(){const{data:t,error:e}=await i.from("titles").select(`
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        genre,
        content_format,
        tone,
        keywords,
        comps,
        pitch,
        created_at,
        updated_at
      `).order("created_at",{ascending:!1});if(e)throw e;return t},async getTitlesPaginated(t=1,e=50){const a=(t-1)*e,r=a+e-1,{data:n,error:o,count:s}=await i.from("titles").select(`
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        genre,
        content_format,
        tone,
        keywords,
        comps,
        pitch,
        created_at,
        updated_at
      `,{count:"exact"}).order("created_at",{ascending:!1}).range(a,r);if(o)throw o;return{data:n||[],count:s||0,totalPages:Math.ceil((s||0)/e)}},async getTitlesByCreator(t){const{data:e,error:a}=await i.from("titles").select("*").eq("creator_id",t).order("created_at",{ascending:!1});if(a)throw a;return e},async getTitleById(t){const{data:e,error:a}=await i.from("titles").select("*").eq("title_id",t).single();if(a)throw a;return e},async createTitle(t){const{data:e,error:a}=await i.from("titles").insert(t).select().single();if(a)throw a;return e},async updateTitle(t,e){const{data:a,error:r}=await i.from("titles").update(e).eq("title_id",t).select().single();if(r)throw r;return a},async deleteTitle(t){const{error:e}=await i.from("titles").delete().eq("title_id",t);if(e)throw e},async getTitlesEssential(){const{data:t,error:e}=await i.from("titles").select(`
        title_id,
        title_name_en,
        title_name_kr,
        genre,
        pitch,
        updated_at
      `).order("updated_at",{ascending:!1});if(e)throw e;return t},async searchTitles(t,e){let a=i.from("titles").select("*");t&&(a=a.or(`title_name_kr.ilike.%${t}%,title_name_en.ilike.%${t}%,original_author.ilike.%${t}%,story_author.ilike.%${t}%,art_author.ilike.%${t}%,tagline.ilike.%${t}%,synopsis.ilike.%${t}%,perfect_for.ilike.%${t}%,tone.ilike.%${t}%,audience.ilike.%${t}%,note.ilike.%${t}%,rights.ilike.%${t}%,keywords.cs.{${t}},comps.cs.{${t}}`)),e!=null&&e.genre&&(a=a.eq("genre",e.genre)),e!=null&&e.content_format&&(a=a.eq("content_format",e.content_format));const{data:r,error:n}=await a.order("created_at",{ascending:!1});if(n)throw n;return r}};export{l as t};
