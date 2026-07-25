declare module 'xss-clean';

declare global {
	namespace Express {
		interface UploadedImage {
			secure_url: string;
			public_id: string;
			width?: number;
			height?: number;
			format?: string;
			bytes?: number;
		}

		interface Request {
			uploadedFile?: UploadedImage;
			uploadedFiles?: UploadedImage[];
		}
	}
}

export {};
