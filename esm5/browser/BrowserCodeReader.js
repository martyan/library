"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HTMLCanvasElementLuminanceSource_1 = require("./HTMLCanvasElementLuminanceSource");
var VideoInputDevice_1 = require("./VideoInputDevice");
var BinaryBitmap_1 = require("../core/BinaryBitmap");
var HybridBinarizer_1 = require("../core/common/HybridBinarizer");
var NotFoundException_1 = require("../core/NotFoundException");
var ArgumentException_1 = require("../core/ArgumentException");
var ChecksumException_1 = require("../core/ChecksumException");
var FormatException_1 = require("../core/FormatException");
/**
 * @deprecated Moving to @zxing/browser
 *
 * Base class for browser code reader.
 */
var BrowserCodeReader = /** @class */ (function () {
    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     *
     * @memberOf BrowserCodeReader
     */
    function BrowserCodeReader(reader, timeBetweenScansMillis, hints) {
        if (timeBetweenScansMillis === void 0) { timeBetweenScansMillis = 500; }
        this.reader = reader;
        this.timeBetweenScansMillis = timeBetweenScansMillis;
        this.hints = hints;
    }
    /**
     * Obtain the list of available devices with type 'videoinput'.
     *
     * @returns {Promise<VideoInputDevice[]>} an array of available video input devices
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.getVideoInputDevices = function () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.enumerateDevices()
                .then(function (devices) {
                var sources = new Array();
                var c = 0;
                for (var i = 0, length_1 = devices.length; i !== length_1; i++) {
                    var device = devices[i];
                    if (device.kind === 'videoinput') {
                        sources.push(new VideoInputDevice_1.VideoInputDevice(device.deviceId, device.label || "Video source " + c));
                        c++;
                    }
                }
                resolve(sources);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     * Decodes the barcode from the device specified by deviceId while showing the video in the specified video element.
     *
     * @param {string} [deviceId] the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param {(string|HTMLVideoElement)} [videoElement] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @param torch
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromInputVideoDevice = function (deviceId, videoElement, torch) {
        var _this = this;
        this.reset();
        this.prepareVideoElement(videoElement);
        var constraints;
        if (undefined === deviceId) {
            constraints = {
                video: { facingMode: 'environment' }
            };
        }
        else {
            constraints = {
                video: { deviceId: { exact: deviceId } }
            };
        }
        return new Promise(function (resolve, reject) {
            var callback = function () {
                _this.decodeOnceWithDelay(resolve, reject);
            };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) { return _this.startDecodeFromStream(stream, callback, torch); })
                .catch(function (error) { return reject(error); });
        });
    };
    /**
     * Sets the new stream and request a new decoding-with-delay.
     *
     * @param stream The stream to be shown in the video element.
     * @param callbackFn A callback for the decode method.
     *
     * @param torch
     * @todo Return Promise<Result>
     */
    BrowserCodeReader.prototype.startDecodeFromStream = function (stream, callbackFn, torch) {
        this.stream = stream;
        var track = stream.getVideoTracks()[0];
        // @ts-ignore
        var imageCapture = new ImageCapture(track);
        var photoCapabilities = imageCapture.getPhotoCapabilities().then(function (capabilities) {
            if (capabilities.fillLightMode.indexOf('flash') > -1) {
                track.applyConstraints({
                    // @ts-ignore
                    advanced: [{ torch: !!torch }]
                });
            }
        });
        this.bindVideoSrc(this.videoElement, stream);
        this.bindEvents(this.videoElement, callbackFn);
    };
    /**
     * Binds listeners and callbacks to the videoElement.
     *
     * @param videoElement
     * @param callbackFn
     */
    BrowserCodeReader.prototype.bindEvents = function (videoElement, listener) {
        this.videoPlayingEventListener = listener;
        videoElement.addEventListener('playing', this.videoPlayingEventListener);
        this.videoLoadedMetadataEventListener = function () { return videoElement.play(); };
        videoElement.addEventListener('loadedmetadata', this.videoLoadedMetadataEventListener);
    };
    /**
     * Decodes a barcode form a video url.
     *
     * @param {string} videoUrl The video url to decode from, required.
     * @param {(string|HTMLVideoElement)} [videoElement] The video element where to play the video while decoding. Can be undefined in which case no video is shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromVideoSource = function (videoUrl, videoElement) {
        var _this = this;
        this.reset();
        this.prepareVideoElement(videoElement);
        return new Promise(function (resolve, reject) {
            _this.videoPlayEndedEventListener = function () {
                _this.stopStreams();
                reject(new NotFoundException_1.default());
            };
            _this.videoElement.addEventListener('ended', _this.videoPlayEndedEventListener);
            _this.videoPlayingEventListener = function () {
                _this.decodeOnceWithDelay(resolve, reject);
            };
            _this.videoElement.addEventListener('playing', _this.videoPlayingEventListener);
            _this.videoElement.setAttribute('autoplay', 'true');
            _this.videoElement.setAttribute('src', videoUrl);
        });
    };
    /**
     * Sets a HTMLVideoElement for scanning or creates a new one.
     *
     * @param videoElement The HTMLVideoElement to be set.
     */
    BrowserCodeReader.prototype.prepareVideoElement = function (videoElement) {
        if (!videoElement && typeof document !== 'undefined') {
            videoElement = document.createElement('video');
            videoElement.width = 200;
            videoElement.height = 200;
        }
        if (typeof videoElement === 'string') {
            videoElement = this.getMediaElement(videoElement, 'video');
        }
        // Needed for iOS 11
        videoElement.setAttribute('autoplay', 'true');
        videoElement.setAttribute('muted', 'true');
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('autofocus', 'true');
        this.videoElement = videoElement;
    };
    BrowserCodeReader.prototype.getMediaElement = function (mediaElementId, type) {
        var mediaElement = document.getElementById(mediaElementId);
        if (null === mediaElement) {
            throw new ArgumentException_1.default("element with id '" + mediaElementId + "' not found");
        }
        if (mediaElement.nodeName.toLowerCase() !== type.toLowerCase()) {
            throw new ArgumentException_1.default("element with id '" + mediaElementId + "' must be an " + type + " element");
        }
        return mediaElement;
    };
    /**
     * Decodes the barcode from an image.
     *
     * @param {(string|HTMLImageElement)} [imageElement] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [imageUrl]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.decodeFromImage = function (imageElement, imageUrl) {
        var _this = this;
        this.reset();
        if (undefined === imageElement && undefined === imageUrl) {
            throw new ArgumentException_1.default('either imageElement with a src set or an url must be provided');
        }
        this.prepareImageElement(imageElement);
        return new Promise(function (resolve, reject) {
            if (undefined !== imageUrl) {
                _this.imageLoadedEventListener = function () {
                    _this.decodeOnce(resolve, reject, false, true);
                };
                _this.imageElement.addEventListener('load', _this.imageLoadedEventListener);
                _this.imageElement.src = imageUrl;
            }
            else if (_this.isImageLoaded(_this.imageElement)) {
                _this.decodeOnce(resolve, reject, false, true);
            }
            else {
                throw new ArgumentException_1.default("either src or a loaded img should be provided");
            }
        });
    };
    BrowserCodeReader.prototype.isImageLoaded = function (img) {
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            return false;
        }
        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.
        if (img.naturalWidth === 0) {
            return false;
        }
        // No other way of checking: assume it’s ok.
        return true;
    };
    BrowserCodeReader.prototype.prepareImageElement = function (imageElement) {
        if (typeof imageElement === 'undefined') {
            imageElement = document.createElement('img');
            imageElement.width = 200;
            imageElement.height = 200;
        }
        if (typeof imageElement === 'string') {
            imageElement = this.getMediaElement(imageElement, 'img');
        }
        this.imageElement = imageElement;
    };
    BrowserCodeReader.prototype.decodeOnceWithDelay = function (resolve, reject) {
        this.timeoutHandler = window.setTimeout(this.decodeOnce.bind(this, resolve, reject), this.timeBetweenScansMillis);
    };
    BrowserCodeReader.prototype.decodeOnce = function (resolve, reject, retryIfNotFound, retryIfChecksumOrFormatError) {
        if (retryIfNotFound === void 0) { retryIfNotFound = true; }
        if (retryIfChecksumOrFormatError === void 0) { retryIfChecksumOrFormatError = true; }
        try {
            var result = this.decode();
            resolve(result);
        }
        catch (re) {
            if (retryIfNotFound && re instanceof NotFoundException_1.default) {
                // Not found, trying again
                this.decodeOnceWithDelay(resolve, reject);
            }
            else if (retryIfChecksumOrFormatError && (re instanceof ChecksumException_1.default || re instanceof FormatException_1.default)) {
                // checksum or format error, trying again
                this.decodeOnceWithDelay(resolve, reject);
            }
            else {
                reject(re);
            }
        }
    };
    /**
     * Gets the BinaryBitmap for ya! (and decodes it)
     */
    BrowserCodeReader.prototype.decode = function () {
        // get binary bitmap for decode function
        var binaryBitmap = this.createBinaryBitmap(this.videoElement || this.imageElement);
        return this.decodeBitmap(binaryBitmap);
    };
    /**
     * Creates a binaryBitmap based in some image source.
     *
     * @param mediaElement HTML element containing drawable image source.
     */
    BrowserCodeReader.prototype.createBinaryBitmap = function (mediaElement) {
        if (undefined === this.canvasElementContext) {
            this.prepareCaptureCanvas();
        }
        this.drawImageOnCanvas(this.canvasElementContext, mediaElement);
        var luminanceSource = new HTMLCanvasElementLuminanceSource_1.HTMLCanvasElementLuminanceSource(this.canvasElement);
        var hybridBinarizer = new HybridBinarizer_1.default(luminanceSource);
        return new BinaryBitmap_1.default(hybridBinarizer);
    };
    /**
     * Ovewriting this allows you to manipulate the snapshot image in anyway you want before decode.
     */
    BrowserCodeReader.prototype.drawImageOnCanvas = function (canvasElementContext, srcElement) {
        canvasElementContext.drawImage(srcElement, 0, 0);
    };
    /**
     * Call the encapsulated readers decode
     */
    BrowserCodeReader.prototype.decodeBitmap = function (binaryBitmap) {
        return this.reader.decode(binaryBitmap, this.hints);
    };
    /**
     * 🖌 Prepares the canvas for capture and scan frames.
     */
    BrowserCodeReader.prototype.prepareCaptureCanvas = function () {
        if (typeof document === 'undefined') {
            this.canvasElement = undefined;
            this.canvasElementContext = undefined;
            return;
        }
        var canvasElement = document.createElement('canvas');
        var width;
        var height;
        if (typeof this.videoElement !== 'undefined') {
            width = this.videoElement.videoWidth;
            height = this.videoElement.videoHeight;
        }
        if (!width && !height && typeof this.imageElement !== 'undefined') {
            width = this.imageElement.naturalWidth || this.imageElement.width;
            height = this.imageElement.naturalHeight || this.imageElement.height;
        }
        canvasElement.style.width = width + 'px';
        canvasElement.style.height = height + 'px';
        canvasElement.width = width;
        canvasElement.height = height;
        this.canvasElement = canvasElement;
        this.canvasElementContext = canvasElement.getContext('2d');
    };
    /**
     * Stops the continuous scan and cleans the stream.
     */
    BrowserCodeReader.prototype.stopStreams = function () {
        if (this.stream) {
            var track = this.stream.getVideoTracks()[0];
            track.applyConstraints({
                // @ts-ignore
                advanced: [{ torch: false }]
            });
            this.stream.getVideoTracks().forEach(function (t) { return t.stop(); });
            this.stream = undefined;
        }
    };
    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     *
     * @memberOf BrowserCodeReader
     */
    BrowserCodeReader.prototype.reset = function () {
        // stops the camera, preview and scan 🔴
        this.stopStreams();
        if (undefined !== this.videoPlayEndedEventListener && undefined !== this.videoElement) {
            this.videoElement.removeEventListener('ended', this.videoPlayEndedEventListener);
        }
        if (undefined !== this.videoPlayingEventListener && undefined !== this.videoElement) {
            this.videoElement.removeEventListener('playing', this.videoPlayingEventListener);
        }
        if (undefined !== this.videoElement) {
            this.unbindVideoSrc(this.videoElement);
            this.videoElement = undefined;
        }
        if (undefined !== this.videoPlayEndedEventListener && undefined !== this.imageElement) {
            this.imageElement.removeEventListener('load', this.imageLoadedEventListener);
        }
        if (undefined !== this.imageElement) {
            this.imageElement.src = undefined;
            this.imageElement.removeAttribute('src');
            this.imageElement = undefined;
        }
        this.canvasElementContext = undefined;
        this.canvasElement = undefined;
    };
    /**
     * Defines what the videoElement src will be.
     *
     * @param videoElement
     * @param stream
     */
    BrowserCodeReader.prototype.bindVideoSrc = function (videoElement, stream) {
        // Older browsers may not have `srcObject`
        try {
            // @NOTE Throws Exception if interrupted by a new loaded request
            videoElement.srcObject = stream;
        }
        catch (err) {
            // @NOTE Avoid using this in new browsers, as it is going away.
            videoElement.src = window.URL.createObjectURL(stream);
        }
    };
    /**
     * Unbinds a HTML video src property.
     *
     * @param videoElement
     */
    BrowserCodeReader.prototype.unbindVideoSrc = function (videoElement) {
        try {
            videoElement.srcObject = null;
        }
        catch (err) {
            videoElement.src = '';
        }
    };
    return BrowserCodeReader;
}());
exports.BrowserCodeReader = BrowserCodeReader;
//# sourceMappingURL=BrowserCodeReader.js.map