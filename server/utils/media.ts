import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface UploadedFile {
  filename: string
  url: string
  size: number
  mimeType: string
}

export async function uploadMedia(file: File): Promise<UploadedFile> {
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  // Ensure upload directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${uuidv4()}.${ext}`
  const filepath = join(uploadDir, filename)

  // Convert file to buffer and save
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return {
    filename,
    url: `/uploads/${filename}`,
    size: file.size,
    mimeType: file.type
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit.' }
  }

  return { valid: true }
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only MP4, WebM, and OGG videos are allowed.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 100MB limit.' }
  }

  return { valid: true }
}
