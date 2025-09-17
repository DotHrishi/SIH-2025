import { useState, useRef } from 'react';

const ImageUpload = ({ onImagesChange, maxImages = 5, maxSizePerImage = 5 * 1024 * 1024 }) => {
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const errors = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name}: Only image files are allowed`);
    }
    
    // Check file size
    if (file.size > maxSizePerImage) {
      errors.push(`${file.name}: File size must be less than ${maxSizePerImage / (1024 * 1024)}MB`);
    }
    
    return errors;
  };

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    const newErrors = [];
    const validFiles = [];

    // Check total number of images
    if (images.length + fileArray.length > maxImages) {
      newErrors.push(`Maximum ${maxImages} images allowed`);
      return;
    }

    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create preview URLs and add to images
    const newImages = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    setErrors([]);
    
    if (onImagesChange) {
      onImagesChange(updatedImages.map(img => img.file));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    
    if (onImagesChange) {
      onImagesChange(updatedImages.map(img => img.file));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📷</div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxImages} images, up to {maxSizePerImage / (1024 * 1024)}MB each
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-red-500 mr-2">⚠️</span>
            <h4 className="text-red-800 font-medium">Upload Errors</h4>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">
            Selected Images ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                >
                  ×
                </button>
                
                {/* Image info */}
                <div className="mt-2 text-xs text-gray-600">
                  <p className="truncate" title={image.name}>{image.name}</p>
                  <p>{formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">Uploading images...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;