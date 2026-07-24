import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

//client for use on the server (Route Handlers, Server Components)
//it reads/writes cookies so it knows so it knows WHO the logged-in user is.

export async function createClient(){
const cookieStore  = await cookies();

return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    {
        cookies: {
        getAll() {
            return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
        try {
            cookiesToSet.forEach(({name,value, options})=>
            cookieStore.set(name, value, options)
        );
        }catch {
            //ignored : happens when called from a Server Component,
            //where cookies are read-only. Fine for now.
        }
        
        },
        },
        }
        );
   
}