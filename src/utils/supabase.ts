import { createClient } from '@supabase/supabase-js'
import { supabaseToken, supabaseUrl } from './config'

const supabase = createClient(supabaseUrl, supabaseToken)

export async function uploadFile(file: Express.Multer.File) {
  const bucket = 'pictures'
  const date = Date.now().toString()
  const name = file.originalname
  const path = name + date
  const { error } = await supabase.storage.from(bucket).upload(path, file.buffer)
  if (error) return { error: error.cause }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  if (!data.publicUrl) return { error: 'Not Url' }
  return data.publicUrl
}
