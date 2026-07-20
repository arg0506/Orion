import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { 
  QrCode, Camera, Upload, Copy, Download, X, 
  RefreshCw, Check, CheckCircle2, Sparkles, ScanLine, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// 1. QR CODE GENERATOR COMPONENT
// ==========================================
interface AddressQRCodeGeneratorProps {
  address: string;
  label?: string;
  network?: string;
}

export function AddressQRCodeGenerator({ address, label = 'Stellar Address', network = 'TESTNET' }: AddressQRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${label.toLowerCase().replace(/\s+/g, '_')}_qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
    toast.success('QR Code SVG downloaded!');
  };

  return (
    <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
      {/* Decorative corner lines */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 group-hover:border-white/40 transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 group-hover:border-white/40 transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />

      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="flex items-center gap-1.5">
            <QrCode size={14} className="text-white/60" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">
              {label}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[8px] text-white font-bold tracking-widest font-mono uppercase">
            {network}
          </span>
        </div>

        {/* QR Core Container with High Contrast Dark Glass Styling */}
        <div 
          ref={qrRef} 
          className="p-4 rounded-xl bg-black/80 border border-white/10 shadow-inner relative flex items-center justify-center group-hover:scale-102 transition-transform duration-300"
        >
          <QRCodeSVG
            value={address}
            size={168}
            bgColor={"#000000"}
            fgColor={"#ffffff"}
            level={"H"}
            includeMargin={true}
          />
        </div>

        {/* Address text string */}
        <div className="w-full">
          <p className="text-[10px] text-gray-500 font-mono mb-1 uppercase tracking-wider">Public Wallet Address</p>
          <div className="p-2.5 rounded bg-black/60 border border-white/5 flex items-center justify-between gap-2 overflow-hidden w-full">
            <span className="text-xs font-mono text-gray-300 truncate select-all block text-left">
              {address}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Copy Address"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 w-full pt-1">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <button
            onClick={handleDownloadSVG}
            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
          >
            <Download size={12} />
            DOWNLOAD
          </button>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 2. QR CODE SCANNER COMPONENT
// ==========================================
interface AddressQRCodeScannerProps {
  onScanSuccess: (scannedAddress: string) => void;
  isOpen: boolean;
  onClose: () => void;
  allowedTypes?: 'stellar' | 'evm' | 'any';
}

export function AddressQRCodeScanner({ onScanSuccess, isOpen, onClose, allowedTypes = 'any' }: AddressQRCodeScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  
  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);

  // Close scanner and cleanup
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    } else {
      // Re-trigger camera if camera tab is selected
      if (activeTab === 'camera') {
        startCamera();
      }
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        // Start decoding ticks
        requestRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error('Camera capture error:', err);
      let errorMsg = 'Could not access camera. Please verify permission settings.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera permission was denied. Try dragging & dropping a QR Code image instead!';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      }
      setCameraError(errorMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    // Start camera will re-trigger on state update due to activeTab/isOpen dependency if we call startCamera after state change.
  };

  // Trigger flip camera
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && cameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Decode a single video frame
  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (decoded && decoded.data) {
            handleDecodedData(decoded.data);
            return; // Stop requesting frames
          }
        }
      }
    }
    // Loop next frame
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  // Address pattern validation & processing
  const handleDecodedData = (data: string) => {
    const cleanData = data.trim();
    
    // Stellar address starts with 'G' and is 56 chars
    const isStellar = /^G[A-Z2-7]{55}$/.test(cleanData);
    // EVM address starts with '0x' and is 42 chars
    const isEVM = /^0x[a-fA-F0-9]{40}$/.test(cleanData);

    if (allowedTypes === 'stellar' && !isStellar) {
      toast.error('Scanned QR code is not a valid Stellar G-address.');
      return;
    }
    if (allowedTypes === 'evm' && !isEVM) {
      toast.error('Scanned QR code is not a valid Ethereum (0x) address.');
      return;
    }
    if (allowedTypes === 'any' && !isStellar && !isEVM) {
      toast.error('Scanned QR code does not contain a valid wallet address.');
      return;
    }

    // Success!
    stopCamera();
    onScanSuccess(cleanData);
    onClose();
  };

  // Image Upload Processing
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (decoded && decoded.data) {
            handleDecodedData(decoded.data);
          } else {
            toast.error('No readable QR code found in this image. Make sure it is clear and high-contrast!');
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-lg border border-white/10 bg-black/95 shadow-2xl p-6 z-10 font-mono text-xs overflow-hidden"
        >
          {/* Decorative scanner lines or corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2">
              <ScanLine className="text-white animate-pulse" size={16} />
              <h3 className="font-display font-bold text-sm tracking-widest text-white uppercase">
                QR ADDRESS SCANNER
              </h3>
            </div>
            <button 
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 border border-white/10 rounded mb-5">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center justify-center gap-2 py-2 px-3 font-bold transition-all cursor-pointer ${
                activeTab === 'camera' 
                  ? 'bg-white text-black font-semibold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Camera size={14} />
              LIVE CAMERA
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center justify-center gap-2 py-2 px-3 font-bold transition-all cursor-pointer ${
                activeTab === 'upload' 
                  ? 'bg-white text-black font-semibold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload size={14} />
              IMAGE UPLOAD
            </button>
          </div>

          {/* ACTIVE VIEW CONTENT */}
          <div className="min-h-[260px] flex flex-col justify-center">
            {activeTab === 'camera' ? (
              <div className="relative rounded overflow-hidden bg-black/60 border border-white/5 flex flex-col items-center justify-center min-h-[260px]">
                {cameraError ? (
                  <div className="p-6 text-center space-y-4 max-w-sm">
                    <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {cameraError}
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 border border-white/10 hover:border-white text-white transition-all text-[10px] tracking-wider uppercase font-bold"
                    >
                      TRY CAMERA AGAIN
                    </button>
                  </div>
                ) : !cameraActive ? (
                  <div className="text-center space-y-3">
                    <RefreshCw size={24} className="animate-spin text-white/40 mx-auto" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block">
                      Locking Video Feed...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Live Video Output */}
                    <video 
                      ref={videoRef}
                      className="w-full h-auto max-h-[260px] object-cover"
                      playsInline
                      muted
                    />
                    
                    {/* Floating Target Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-40 border-2 border-dashed border-white/60 rounded-lg relative">
                        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-white" />
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-white" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-white" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-white" />
                        
                        {/* Moving Scanning Line Animation */}
                        <div className="w-full h-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] absolute animate-bounce top-1/2" />
                      </div>
                    </div>

                    {/* Camera Control Panel */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-black/80 backdrop-blur-md rounded border border-white/10 z-10">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        LIVE_FEED_ONLINE
                      </span>
                      <button
                        onClick={flipCamera}
                        className="px-2 py-1 bg-white/10 hover:bg-white text-white hover:text-black transition-colors rounded text-[9px] font-bold cursor-pointer"
                      >
                        FLIP CAMERA
                      </button>
                    </div>
                  </>
                )}
                {/* Hidden canvas to process frames */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              /* Drag and Drop Upload Zone */
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center min-h-[260px] p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-white bg-white/[0.05]' 
                    : 'border-white/20 bg-white/[0.01] hover:border-white/40 hover:bg-white/[0.02]'
                }`}
              >
                <div className="space-y-4 max-w-xs">
                  <div className="p-3.5 bg-white/5 border border-white/10 text-white rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
                    <QrCode size={24} className="text-gray-300" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-white font-bold tracking-wide uppercase text-[11px]">
                      DRAG & DROP IMAGE FILE
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Drop any file image containing a Stellar G-Address or MetaMask (0x) QR code.
                    </p>
                  </div>
                  <div>
                    <label className="inline-block px-5 py-2 bg-white text-black font-bold tracking-widest text-[9px] uppercase hover:bg-gray-200 transition-all cursor-pointer">
                      BROWSE STORAGE
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
            <span>ALLOWED TYPES: {allowedTypes.toUpperCase()}</span>
            <span>JSQR SYSTEM V1.0</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
