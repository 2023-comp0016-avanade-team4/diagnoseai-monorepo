"""
Module to get image summary from GPT-4 Vision
"""
import json
import requests
import logging


class ImageSummary:
    """
    Class to get image summary from GPT-4 Vision
    """
    def __init__(self, base_url: str, api_key: str, deployment_name: str):
        self.endpoint = (f"{base_url}openai/deployments/{deployment_name}"
                         "/chat/completions?api-version=2023-12-01-preview")
        self.headers = {
            "Content-Type": "application/json",
            "api-key": api_key
        }

    def generate_request(self, image: str) -> dict:
        """
        Function to generate request body for GPT-4 Vision
        """
        return {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image
                            }
                        },
                        {
                            "type": "text",
                            "text": (
                                "Given an image with the",
                                "following features, generate a concise",
                                "textual summary that captures the",
                                "key elements and context of the",
                                "image. Imagine this summary will be",
                                "used as a data source for an",
                                "OpenAI embeddings endpoint to",
                                "enable content-based image",
                                "retrieval. Please ensure the summary is",
                                "informative and conveys relevant",
                                "information about the visual content."
                            )
                        }
                    ]
                }

                    ],
            "max_tokens": 2000
        }

    def get_image_summary(self, image: str) -> str:
        """
        Function to get image summary from GPT-4 Vision
        """
        data = self.generate_request(image)
        if not image.startswith("data:image/"):
            raise RuntimeError(
                "Image string is not valid."
                " Please try again with a valid Image.")

        response = requests.post(self.endpoint,
                                 headers=self.headers,
                                 data=json.dumps(data),
                                 timeout=60)
        response = json.loads(response.text)

        message = None
        try:
            # Guaranteed to be correct because of the schema
            message = response['choices'][0]['message']['content']  # type: ignore # pylint: disable=line-too-long # noqa: E501
        except (KeyError, AttributeError):
            logging.error("Malformed response from GPT-4 vision."
                          " Defaulting to none")

        if message is None:
            raise RuntimeError(
                "No response generated by GPT-4 Vision. Please try again.")
        return message
