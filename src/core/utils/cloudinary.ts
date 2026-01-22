/**
 * Cloudinary Upload Utility
 * Handles direct image uploads to Cloudinary from the browser
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Debug logging
console.log('🔍 Cloudinary Debug:', {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    fromEnv: {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    },
    allEnvVars: import.meta.env
})

export interface CloudinaryUploadResult {
    secure_url: string
    public_id: string
    width: number
    height: number
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImageToCloudinary(
    file: File,
    onProgress?: (progress: number) => void,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<string> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        console.error('❌ Cloudinary config missing:', {
            cloudName: CLOUDINARY_CLOUD_NAME,
            uploadPreset: CLOUDINARY_UPLOAD_PRESET
        })
        throw new Error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', 'evzone/sites')

    const xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percentComplete = (e.loaded / e.total) * 100
                onProgress(Math.round(percentComplete))
            }
        })

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response: CloudinaryUploadResult = JSON.parse(xhr.responseText)
                resolve(response.secure_url)
            } else {
                console.error('❌ Cloudinary upload failed:', {
                    status: xhr.status,
                    response: xhr.responseText
                })
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`))
            }
        })

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'))
        })

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`)
        xhr.send(formData)
    })
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadImagesToCloudinary(
    files: File[],
    onProgress?: (current: number, total: number, currentFileProgress: number) => void
): Promise<string[]> {
    const urls: string[] = []

    for (let i = 0; i < files.length; i++) {
        const url = await uploadImageToCloudinary(files[i], (progress) => {
            if (onProgress) {
                onProgress(i + 1, files.length, progress)
            }
        })
        urls.push(url)
    }

    return urls
}

/**
 * Get optimized Cloudinary URL with transformations
 */
export function getOptimizedCloudinaryUrl(
    url: string,
    options: {
        width?: number
        quality?: 'auto' | 'auto:good' | 'auto:best'
        format?: 'auto'
    } = {}
): string {
    const { width, quality = 'auto', format = 'auto' } = options

    if (!url.includes('cloudinary.com')) {
        return url // Not a Cloudinary URL
    }

    const transformations: string[] = []

    if (format) transformations.push(`f_${format}`)
    if (quality) transformations.push(`q_${quality}`)
    if (width) transformations.push(`w_${width}`)

    const transformString = transformations.join(',')

    return url.replace('/upload/', `/upload/${transformString}/`)
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'text/plain', 'application/pdf']
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Only JPEG, PNG, and WebP images are allowed'
        }
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size must be less than 10MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
        }
    }

    return { valid: true }
}
