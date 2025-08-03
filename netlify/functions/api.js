// Simple redirect to main server function
export const handler = async (event, context) => {
  return {
    statusCode: 302,
    headers: {
      Location: '/.netlify/functions/server' + event.path
    }
  };
};