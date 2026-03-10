'use client';

interface PhotosInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
  placeholder?: string;
  maxPhotos?: number;
}

export default function PhotosInput({ value, onChange, placeholder = 'https://example.com/photo.jpg', maxPhotos = 20 }: PhotosInputProps) {
  const addPhoto = () => {
    if (value.length < maxPhotos) onChange([...value, '']);
  };
  const updatePhoto = (i: number, url: string) => {
    const next = [...value];
    next[i] = url.trim();
    onChange(next.filter(Boolean));
  };
  const removePhoto = (i: number) => {
    onChange(value.filter((_, j) => j !== i));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-black dark:text-zinc-300">Photos</label>
      <p className="mt-1 text-xs text-black dark:text-zinc-400">
        Add multiple photo URLs. First photo is the main/cover image.
      </p>
      <div className="mt-2 space-y-2">
        {value.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updatePhoto(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              title="Remove photo"
            >
              Remove
            </button>
          </div>
        ))}
        {value.length < maxPhotos && (
          <button
            type="button"
            onClick={addPhoto}
            className="rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-black hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            + Add photo
          </button>
        )}
      </div>
      {value.length === 0 && (
        <button
          type="button"
          onClick={addPhoto}
          className="mt-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-black hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Add first photo
        </button>
      )}
    </div>
  );
}
