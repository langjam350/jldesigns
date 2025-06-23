import { NextApiResponse } from 'next';

type ErrorResponse = {
  message: string;
  code?: string;
  details?: any;
};

export function handleApiError(
  error: unknown, 
  res: NextApiResponse, 
  customMessage = 'An error occurred',
  statusCode = 500
) {
  console.error(`${customMessage}:`, error);
  
  const errorResponse: ErrorResponse = { 
    message: error instanceof Error ? error.message : customMessage,
  };
  
  // Add additional error details for non-production environments
  if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
    errorResponse.details = {
      stack: error.stack,
      name: error.name,
    };
  }
  
  return res.status(statusCode).json(errorResponse);
}

export function methodNotAllowed(res: NextApiResponse, allowedMethods: string[]) {
  res.setHeader('Allow', allowedMethods);
  return res.status(405).json({ 
    message: `Method Not Allowed. Supported methods: ${allowedMethods.join(', ')}` 
  });
}