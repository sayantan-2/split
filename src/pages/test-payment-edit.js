import { useState, useRef } from 'react';
import Payment from '@/components/Payment';
export default function TestPaymentEdit() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [payment, setPayment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [result, setResult] = useState('');
  const fileInputRef = useRef(null);

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
        // If there's existing payment data, keep it, otherwise initialize with empty object
        if (!payment) {
          setPayment(JSON.stringify({
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            category: '',
            // Add other default fields as needed
          }, null, 2));
        }
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

  const handleEdit = async () => {
    if (!imageUrl || !prompt) return;

    // Create a basic payment object if none exists
    const currentPayment = {
      id: 'payment-' + Date.now(),
      name: 'New Payment',
      currency: 'USD',
      items: [
        {
          name: 'Item 1',
          unitPrice: 0,
          quantity: 1,
          discountPercentage: 0,
          taxPercentage: 0
        }
      ],
      creator: { id: 'user1', name: 'Current User' },
      lastUpdatedAt: new Date().toISOString()
    };

    setIsEditing(true);
    try {
      const response = await fetch(
        `/api/ai/payment/edit?receiptUrl=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}&payment=${encodeURIComponent(JSON.stringify(currentPayment))}`
      );

      const data = await response.json();
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
        // Update the payment display if needed
        if (data.payment) {
          setPayment(JSON.stringify(data.payment, null, 2));
        }
      } else {
        setResult(`Error: ${data.error || data.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Edit error:', error);
      setResult(`Failed to process edit: ${error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Payment Editor</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>1. Upload Receipt Image</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            {file ? file.name : 'Choose File'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            style={{
              padding: '0 16px',
              backgroundColor: (!file || isUploading) ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!file || isUploading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : 'Upload'}
          </button>
        </div>
        {imageUrl && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            border: '1px solid #eaeaea',
            borderRadius: '8px',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Uploaded Image</h3>
            <div style={{
              display: 'flex',
              gap: '20px',
              flexDirection: 'column',
              '@media (min-width: 640px)': {
                flexDirection: 'row'
              }
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <img
                  src={imageUrl}
                  alt="Uploaded receipt"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <div style={{ flex: 1, fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Filename:</strong> {file?.name || 'N/A'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Size:</strong> {file ? Math.round(file.size / 1024) : '0'} KB
                </div>
                <div style={{ wordBreak: 'break-all' }}>
                  <strong>URL:</strong> {imageUrl}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>2. Payment Data (JSON)</h2>
        <Payment
          id="payment-123"
          name="Dinner at Restaurant"
          currency="USD"
          creator={{ id: "user1", name: "John Doe" }}
          lastUpdatedAt={new Date()}
          items={[
            {
              name: "Pizza",
              unitPrice: 12.99,
              quantity: 2,
              discountPercentage: 0,
              taxPercentage: 8.5
            }
          ]}
          onUpdate={(updatedPayment) => console.log('Updated:', updatedPayment)}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>3. Edit Prompt</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your edit instructions..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            marginBottom: '10px',
            fontFamily: 'sans-serif',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleEdit}
          disabled={!imageUrl || !prompt || isEditing}
          style={{
            padding: '8px 16px',
            backgroundColor: (!imageUrl || !prompt || isEditing) ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (!imageUrl || !prompt || isEditing) ? 'not-allowed' : 'pointer'
          }}
        >
          {isEditing ? 'Processing...' : 'Edit Payment'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Result</h2>
          <pre style={{
            padding: '15px',
            borderRadius: '4px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
