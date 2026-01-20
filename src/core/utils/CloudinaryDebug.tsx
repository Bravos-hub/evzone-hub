/**
 * Debug Cloudinary Configuration
 * This component displays the current Cloudinary environment variables
 * to help troubleshoot configuration issues
 */

export function CloudinaryDebug() {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#1a1a1a',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '400px'
        }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>Cloudinary Config Debug</h4>
            <div style={{ marginBottom: '8px' }}>
                <strong>VITE_CLOUDINARY_CLOUD_NAME:</strong>
                <div style={{ color: cloudName ? '#10b981' : '#ef4444', marginLeft: '10px' }}>
                    {cloudName || '❌ undefined'}
                </div>
            </div>
            <div>
                <strong>VITE_CLOUDINARY_UPLOAD_PRESET:</strong>
                <div style={{ color: uploadPreset ? '#10b981' : '#ef4444', marginLeft: '10px' }}>
                    {uploadPreset || '❌ undefined'}
                </div>
            </div>
            <div style={{ marginTop: '10px', padding: '8px', background: '#374151', borderRadius: '4px', fontSize: '10px' }}>
                <strong>Fix:</strong> Ensure .env has:<br />
                VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name<br />
                VITE_CLOUDINARY_UPLOAD_PRESET=your_preset<br />
                <em>(No quotes, restart dev server)</em>
            </div>
        </div>
    )
}
