import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/router';

export default function NewPaymentPage() {
    const fileInputRef = useRef(null);
    const router = useRouter();

    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setImageUrl(data.url);
            } else {
                alert(`Upload failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const processWithGemini = async () => {
        if (!imageUrl || !userInput) {
            alert('Please upload an image and enter text before processing.');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/ai/process-gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: imageUrl,
                    userInput: userInput,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                // Store the result and redirect to output page
                localStorage.setItem('billData', data.result);
                router.push('/output');
            } else {
                alert(`Processing failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Processing error:', error);
            alert('Processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        processWithGemini();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
                        Bill Split Analysis
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-4">
                                Upload Receipt Image
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 px-6 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600 font-medium">
                                            {file ? file.name : 'Choose file or drag and drop'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            PNG, JPG, JPEG up to 5MB
                                        </p>
                                    </div>
                                </button>

                                {file && (
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload Image'}
                                    </button>
                                )}

                                {imageUrl && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-800 font-medium mb-2">Image uploaded successfully!</p>
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={imageUrl}
                                                alt="Uploaded receipt"
                                                className="w-16 h-16 object-cover rounded border"
                                            />
                                            <p className="text-sm text-green-700">
                                                Image is ready for processing.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Text Input Section */}
                        <div>
                            <label htmlFor="userInput" className="block text-lg font-semibold text-gray-900 mb-4">
                                Describe the Split Details
                            </label>
                            <textarea
                                id="userInput"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Describe who ordered what and how the bill should be split..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Press Enter or click Submit to process
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isProcessing || !imageUrl || !userInput}
                            className="w-full bg-gray-900 text-white font-semibold py-4 px-6 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                            {isProcessing ? 'Processing...' : 'Analyze Bill Split'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
