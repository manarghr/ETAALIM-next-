import {createClient} from "@/lib/supabase/server";

import {NextResponse} from "next/server";

//GET/api/courses --> list all courses

export async function GET() {
    const supabase = await createClient();

    const {data, error} = await supabase.from("courses").select("*");

    if (error) {
        return NextResponse.json({error: error.message}, {status: 500});
        
    }
    return NextResponse.json({data});
}