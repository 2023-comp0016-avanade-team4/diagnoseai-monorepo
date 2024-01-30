"""
Function to get image summary from GPT-4 Vision
"""
import os
import json
import requests


api_base = os.environ["GPT4V_API_BASE"]
deployment_name = os.environ['GPT4V_DEPLOYMENT_NAME']
API_KEY = os.environ['GPT4V_API_KEY']

base_url = f"{api_base}openai/deployments/{deployment_name}"
headers = {
    "Content-Type": "application/json",
    "api-key": API_KEY
}

endpoint = f"{base_url}/chat/completions?api-version=2023-12-01-preview"
def generate_request(image: str) -> dict:
    """
    Function to generate request body for GPT-4 Vision
    """
    data = {
            "messages": [
                {
                    "role" : "system",
                    "content" : "You are a helpful AI assistant."
                    },
                {
                    "role" : "user",
                    "content" : [
                        {
                            "type" : "image_url",
                            "image_url" : {
                                "url" : image
                                }
                            },
                        {
                            "type" : "text",
                            "text" : "Given an image with the following features, generate a \
                                    concise textual summary that captures the key elements and context of \
                                    the image. Imagine this summary will be used as a data source \
                                    for an OpenAI embeddings endpoint to enable content-based image retrieval. Please \
                                    ensure the summary is informative and conveys relevant information\
                                    about the visual content."
                            }
                        ]
                    }

                ],
            "max_tokens" : 2000
            }
    return data

def get_image_summary(image: str) -> str:
    """
    Function to get image summary from GPT-4 Vision
    """
    data = generate_request(image)
    if not image.startswith("data:image/"):
        return "Image string is not valid. Please try again with a valid Image."
    response = requests.post(endpoint, headers=headers, data=json.dumps(data))
    response = json.loads(response.text)

    message = response['choices'][0]['message']['content']

    if message is None:
        return "No response generated by GPT-4 Vision. Please try again."
    return message
