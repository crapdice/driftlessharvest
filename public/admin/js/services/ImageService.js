/**
 * ImageService handles requesting pre-signed URLs and uploading files directly to R2.
 */
class ImageService {
    /**
     * Uploads a file to Cloudflare R2 via a pre-signed URL
     * @param {File} file - The file to upload
     * @param {string} category - 'products', 'templates', etc.
     * @returns {Promise<{publicUrl: string, key: string}>}
     */
    async uploadImage(file, category = 'misc') {
        try {
            // 1. Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be under 5MB');
            }

            // 2. Get pre-signed URL from backend
            const filename = file.name;
            const contentType = file.type;
            const urlResponse = await fetch(`/api/images/presigned-url?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}&category=${category}`);

            if (!urlResponse.ok) {
                const errorData = await urlResponse.json();
                throw new Error(errorData.error || 'Failed to get upload URL');
            }

            const { uploadUrl, publicUrl, key } = await urlResponse.json();

            // 3. Upload directly to R2
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image to storage');
            }

            return { publicUrl, key };
        } catch (error) {
            console.error('[ImageService] Upload error:', error);
            throw error;
        }
    }
}

export default new ImageService();
