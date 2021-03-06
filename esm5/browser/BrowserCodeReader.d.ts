import { VideoInputDevice } from './VideoInputDevice';
import Reader from '../core/Reader';
import BinaryBitmap from '../core/BinaryBitmap';
import Result from '../core/Result';
import DecodeHintType from '../core/DecodeHintType';
declare type HTMLVisualMediaElement = HTMLVideoElement | HTMLImageElement;
/**
 * @deprecated Moving to @zxing/browser
 *
 * Base class for browser code reader.
 */
export declare class BrowserCodeReader {
    protected readonly reader: Reader;
    protected timeBetweenScansMillis: number;
    protected hints?: Map<DecodeHintType, any>;
    /**
     * The HTML video element, used to display the camera stream.
     */
    protected videoElement: HTMLVideoElement;
    /**
     * The HTML image element, used as a fallback for the video element when decoding.
     */
    protected imageElement: HTMLImageElement;
    /**
     * The HTML canvas element, used to draw the video or image's frame for decoding.
     */
    protected canvasElement: HTMLCanvasElement;
    /**
     * The HTML canvas element context.
     */
    protected canvasElementContext: CanvasRenderingContext2D;
    protected timeoutHandler: number;
    /**
     * The stream output from camera.
     */
    protected stream: MediaStream;
    /**
     * Should contain the current registered listener for video loaded-metadata,
     * used to unregister that listener when needed.
     */
    protected videoLoadedMetadataEventListener: EventListener;
    /**
     * Should contain the current registered listener for video play-ended,
     * used to unregister that listener when needed.
     */
    protected videoPlayEndedEventListener: EventListener;
    /**
     * Should contain the current registered listener for video playing,
     * used to unregister that listener when needed.
     */
    protected videoPlayingEventListener: EventListener;
    /**
     * Should contain the current registered listener for image loading,
     * used to unregister that listener when needed.
     */
    protected imageLoadedEventListener: EventListener;
    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     *
     * @memberOf BrowserCodeReader
     */
    constructor(reader: Reader, timeBetweenScansMillis?: number, hints?: Map<DecodeHintType, any>);
    /**
     * Obtain the list of available devices with type 'videoinput'.
     *
     * @returns {Promise<VideoInputDevice[]>} an array of available video input devices
     *
     * @memberOf BrowserCodeReader
     */
    getVideoInputDevices(): Promise<VideoInputDevice[]>;
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
    decodeFromInputVideoDevice(deviceId?: string, videoElement?: string | HTMLVideoElement, torch?: boolean): Promise<Result>;
    /**
     * Sets the new stream and request a new decoding-with-delay.
     *
     * @param stream The stream to be shown in the video element.
     * @param callbackFn A callback for the decode method.
     *
     * @param torch
     * @todo Return Promise<Result>
     */
    protected startDecodeFromStream(stream: MediaStream, callbackFn?: (...args: any[]) => any, torch?: boolean): void;
    /**
     * Binds listeners and callbacks to the videoElement.
     *
     * @param videoElement
     * @param callbackFn
     */
    protected bindEvents(videoElement: HTMLVideoElement, listener: EventListener): void;
    /**
     * Decodes a barcode form a video url.
     *
     * @param {string} videoUrl The video url to decode from, required.
     * @param {(string|HTMLVideoElement)} [videoElement] The video element where to play the video while decoding. Can be undefined in which case no video is shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromVideoSource(videoUrl: string, videoElement?: string | HTMLVideoElement): Promise<Result>;
    /**
     * Sets a HTMLVideoElement for scanning or creates a new one.
     *
     * @param videoElement The HTMLVideoElement to be set.
     */
    protected prepareVideoElement(videoElement?: HTMLVideoElement | string): void;
    protected getMediaElement(mediaElementId: string, type: string): HTMLElement;
    /**
     * Decodes the barcode from an image.
     *
     * @param {(string|HTMLImageElement)} [imageElement] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [imageUrl]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    decodeFromImage(imageElement?: string | HTMLImageElement, imageUrl?: string): Promise<Result>;
    protected isImageLoaded(img: HTMLImageElement): boolean;
    protected prepareImageElement(imageElement?: string | HTMLImageElement): void;
    protected decodeOnceWithDelay(resolve: (result: Result) => any, reject: (error: any) => any): void;
    protected decodeOnce(resolve: (result: Result) => any, reject: (error: any) => any, retryIfNotFound?: boolean, retryIfChecksumOrFormatError?: boolean): void;
    /**
     * Gets the BinaryBitmap for ya! (and decodes it)
     */
    protected decode(): Result;
    /**
     * Creates a binaryBitmap based in some image source.
     *
     * @param mediaElement HTML element containing drawable image source.
     */
    protected createBinaryBitmap(mediaElement: HTMLVisualMediaElement): BinaryBitmap;
    /**
     * Ovewriting this allows you to manipulate the snapshot image in anyway you want before decode.
     */
    protected drawImageOnCanvas(canvasElementContext: CanvasRenderingContext2D, srcElement: HTMLVisualMediaElement): void;
    /**
     * Call the encapsulated readers decode
     */
    protected decodeBitmap(binaryBitmap: BinaryBitmap): Result;
    /**
     * 🖌 Prepares the canvas for capture and scan frames.
     */
    protected prepareCaptureCanvas(): void;
    /**
     * Stops the continuous scan and cleans the stream.
     */
    protected stopStreams(): void;
    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     *
     * @memberOf BrowserCodeReader
     */
    reset(): void;
    /**
     * Defines what the videoElement src will be.
     *
     * @param videoElement
     * @param stream
     */
    bindVideoSrc(videoElement: HTMLVideoElement, stream: MediaStream): void;
    /**
     * Unbinds a HTML video src property.
     *
     * @param videoElement
     */
    unbindVideoSrc(videoElement: HTMLVideoElement): void;
}
export {};
