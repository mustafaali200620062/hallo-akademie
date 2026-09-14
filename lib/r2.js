import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ✅ إنشاء عميل S3 للتعامل مع R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// ✅ رفع ملف إلى R2
export async function uploadFile(file, fileName) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await r2Client.send(command)
    
    return {
      success: true,
      fileName,
      url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`,
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error)
    throw error
  }
}

// ✅ حذف ملف من R2
export async function deleteFile(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
    })

    await r2Client.send(command)
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting file:', error)
    throw error
  }
}

// ✅ جلب رابط مؤقت لملف (صالح لمدة ساعة)
export async function getFileUrl(fileName, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('❌ Error getting file URL:', error)
    throw error
  }
}

// ✅ جلب قائمة الملفات في R2
export async function listFiles(prefix = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
    })

    const response = await r2Client.send(command)
    return response.Contents || []
  } catch (error) {
    console.error('❌ Error listing files:', error)
    throw error
  }
}