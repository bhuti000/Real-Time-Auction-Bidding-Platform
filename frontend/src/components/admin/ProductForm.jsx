import React, { useState } from 'react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import { api, extractApiError } from '../../lib/api';
import { Upload, X, CheckCircle2 } from 'lucide-react';

const initialFormState = {
  title: '',
  description: '',
  category: 'Fine Art',
  startBid: '',
  startTime: '',
  endTime: '',
  imageUrl: '',
};

function ProductForm({ onSubmit }) {
  const [form, setForm] = useState(initialFormState);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data.data.url;
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setUploadError(extractApiError(err, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    onSubmit?.(form);
    setForm(initialFormState);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        label="Product title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="e.g. Apple Watch Ultra"
        required
      />
      <Input
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Short lot description"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-on-surface font-body" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full rounded-xl border border-surface-container-highest bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="Fine Art">Fine Art</option>
          <option value="Photography">Photography</option>
          <option value="Contemporary Art">Contemporary Art</option>
          <option value="Horology">Horology</option>
          <option value="Vehicles">Vehicles</option>
          <option value="Collectibles">Collectibles</option>
          <option value="Electronics">Electronics</option>
          <option value="Sculpture">Sculpture</option>
          <option value="Others">Others</option>
        </select>
      </div>
      <Input
        label="Starting bid ($)"
        name="startBid"
        type="number"
        min="0"
        step="1"
        value={form.startBid}
        onChange={handleChange}
        placeholder="100"
      />
      <Input
        label="Start time"
        name="startTime"
        type="datetime-local"
        value={form.startTime}
        onChange={handleChange}
      />
      <Input
        label="End time"
        name="endTime"
        type="datetime-local"
        value={form.endTime}
        onChange={handleChange}
      />
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-on-surface font-body">Product Image</label>
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${
            form.imageUrl 
              ? 'border-secondary/30 bg-secondary/5' 
              : 'border-surface-container-highest bg-surface-container-low hover:border-primary/50'
          }`}
        >
          {form.imageUrl ? (
            <>
              <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm">
                <img 
                  src={`${api.defaults.baseURL}${form.imageUrl}`} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-secondary text-sm font-semibold">
                  <CheckCircle2 size={16} />
                  Image uploaded
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                  className="text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Remove
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-body font-semibold text-on-surface">
                  {uploading ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">PNG, JPG, WebP up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </>
          )}
        </div>
        {uploadError && (
          <p className="text-xs text-error font-body mt-1">{uploadError}</p>
        )}
      </div>
      <Button type="submit" className="w-full mt-2">
        Add Product
      </Button>
    </form>
  );
}

export default ProductForm;
