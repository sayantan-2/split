import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Camera, ArrowLeft, Upload } from 'lucide-react';
import BottomNav from '../../../components/BottomNav';
import Payment from '../../../components/Payment';

export default function NewPaymentPage() {
    const router = useRouter();
    const { receipt } = router.query;
    const fileInputRef = useRef(null);

    const [step, setStep] = useState(receipt === 'true' ? 'upload' : 'manual');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [paymentData, setPaymentData] = useState({
        id: `payment-${Date.now()}`,
        name: 'New Payment',
        currency: 'USD',
        items: [
            {
                name: 'Item 1',
                unitPrice: 0,
                quantity: 1,
                discountPercentage: 0,
                taxPercentage: 0,
                splitEqually: null,
                splitByExactAmounts: null,
                splitByPercentages: null,
                splitByShares: null,
                splitByAdjustments: null,
            }
        ]
    });

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
                // Auto-proceed to manual entry after successful upload
                setStep('manual');
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

    const handlePaymentUpdate = (updatedPayment) => {
        setPaymentData(updatedPayment);
    };

    const handleSavePayment = () => {
        // Here you would typically save the payment to your backend
        console.log('Saving payment:', paymentData);
        // For now, redirect to output page or wherever you want to show the result
        router.push('/output');
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Main Content Area */}
            <div className="md:ml-64">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
                    {/* Header */}
                    <div className="flex items-center justify-between pt-6 sm:pt-8 pb-4 sm:pb-6">
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                            New Payment
                        </h1>
                        <div className="w-10 sm:w-12" />
                    </div>

                    {/* Content based on step */}
                    {step === 'upload' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Receipt</h2>
                                    <p className="text-gray-600">Take a photo or upload an image of your receipt</p>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    <button
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
                                            onClick={handleUpload}
                                            disabled={isUploading}
                                            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isUploading ? 'Uploading...' : 'Upload Receipt'}
                                        </button>
                                    )}

                                    <div className="text-center">
                                        <button
                                            onClick={() => setStep('manual')}
                                            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                        >
                                            Skip and enter manually
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'manual' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                {imageUrl && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-800 font-medium mb-2">Receipt uploaded successfully!</p>
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={imageUrl}
                                                alt="Uploaded receipt"
                                                className="w-16 h-16 object-cover rounded border"
                                            />
                                            <p className="text-sm text-green-700">
                                                You can now manually enter or edit the payment details below.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <Payment
                                    id={paymentData.id}
                                    name={paymentData.name}
                                    currency={paymentData.currency}
                                    creator={{ id: "current-user", name: "Current User" }}
                                    items={paymentData.items}
                                    onUpdate={handlePaymentUpdate}
                                />

                                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <button
                                        onClick={() => router.back()}
                                        className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePayment}
                                        className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        Save Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav active="payment" />
        </div>
    );
}
