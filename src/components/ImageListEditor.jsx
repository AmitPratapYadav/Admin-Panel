import { LoaderCircle, Plus, Trash2, Upload } from 'lucide-react';

const ImageListEditor = ({
  images = [],
  onChange = () => {},
  onUpload = () => {},
  uploadLoading = false,
}) => {
  const updateImages = (nextImages) => {
    onChange(nextImages);
  };

  const addEmptyImage = () => {
    updateImages([
      ...images,
      {
        image_url: '',
        cloudinary_public_id: '',
        alt_text: '',
        is_primary: images.length === 0,
        sort_order: images.length,
      },
    ]);
  };

  const updateField = (index, field, value) => {
    updateImages(
      images.map((image, currentIndex) =>
        currentIndex === index
          ? {
              ...image,
              [field]: value,
            }
          : field === 'is_primary' && value
          ? {
              ...image,
              is_primary: false,
            }
          : image
      )
    );
  };

  const removeImage = (index) => {
    updateImages(images.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload Cloudinary-backed images or paste manual image URLs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {uploadLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploadLoading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = '';
              }}
            />
          </label>

          <button
            type="button"
            onClick={addEmptyImage}
            className="inline-flex items-center gap-2 rounded-xl bg-[#9BCBBF] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} />
            Add URL
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
          No images added yet.
        </div>
      ) : null}

      <div className="space-y-4">
        {images.map((image, index) => (
          <div key={`image-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
              <div className="h-28 w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                {image.image_url ? (
                  <img src={image.image_url} alt={image.alt_text || 'Product'} className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <input
                      type="text"
                      value={image.image_url}
                      onChange={(e) => updateField(index, 'image_url', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
                    <input
                      type="text"
                      value={image.alt_text || ''}
                      onChange={(e) => updateField(index, 'alt_text', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cloudinary Public ID</label>
                    <input
                      type="text"
                      value={image.cloudinary_public_id || ''}
                      onChange={(e) => updateField(index, 'cloudinary_public_id', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                    <input
                      type="number"
                      min="0"
                      value={image.sort_order ?? index}
                      onChange={(e) => updateField(index, 'sort_order', Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!image.is_primary}
                        onChange={(e) => updateField(index, 'is_primary', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Primary image
                    </label>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageListEditor;
