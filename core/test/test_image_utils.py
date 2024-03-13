"""
Module to test image utilities
"""

import base64
import unittest
from io import BytesIO
from unittest.mock import MagicMock, patch
from base_test_case import BaseTestCase

import puremagic  # type: ignore[import-untyped]
from core.utils.image_utils import (compress_image,
                                    get_preauthenticated_blob_url,
                                    is_url_encoded_image)
from PIL import Image

image_base64 = "iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAQAAADYBBcfAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfoAQgWDyUaICVaAAAEPElEQVQ4y12Ua4iUZRTH/+e97Mw0OzM7e9PddRXNWybebQ3UVrEkqSwSkwKRioI+JKF9KMsEIQhFMAyhDwUVpH3IC2ptaIhiIBmuIZm56wVveaF119vOvO/7/PqwY2jncOD58Jzb/3/O8SWzBYbuei1eL7IndE4PStpChV7KcqQsryr1S5JMJvIWeHOT3uByquuxpK3qbjzcjaaMeYH9Xf5dUXhw9h/7XNF3LnJmt5EkpZTxzJNGNlV9lruWjQOEMDzEUp5jIm1uGE1f5moDNVjO6lQ3UEi9L/swHa5Sz2xeQq45Whntijvjb+KH4+FxfTwumpOMdQ+RPVO9pzg3p5zfYoEkVatujI5NZAeb3GD3Kts4wAFOAFe4wVlmIzJkXTYpUvNijfJVvvImqXVM6rd5lOLdLmQqK2nCCMmzAehhPRlStJKjPkmRO9w6epia/UFqNNmaCRBtJaRAEUNsBJYTcodl+HQwizxiLStdlmJncYQ0yHtaUscrfOBEljzLmM8G+tnOEKaQsAixlW62soOrHKYYiZofJHkjTdq/mktJJ52008gLtNNAgVVcJuEqn5KllhaaaUIsYlc8AvtIKvimk++N/piSpdSrjboh06Nq1wjFkky+zuukSpKkjCao3r3lbT6qKS2mfPQrjlv0s51TQAI4SkTERJRwgGNAImAXut0yo1Y26M6RTLNKyqhNOe2Ur5SQ/TdwyBTrqo7rZ8Xy1Oa2eN/vd3Os9taebJsihdqnZ2SarhVKV1yR1K/P1a2zQuM0SGdUYp0tvVY/STq4GFyEAw6xhnGkqCYkJCSgmiyLWcEmDgGbaWIKf9JI1Uz5bw/hagJlyjigl+v0cKOiPVynXOn8LzLM4zh3XStarpah6n4fXB8RjugBMAZeAyBBBz7XSYA30Wn5yr5e5EKcUAIcjuR/6nDEQAdpLnMH2Ev6opdV67aeC+/6vSSVBfUq5uRk9+F7W6a0MpJ61Z9V6AUaPEu3v67w9GCZSYVXR8R4nhpg001DW1VjBV/Sd5M5FUO58g0S1rKFhIR++oHDiJ1AQhc1+AskNXiTNG2Mjj4PSamSAcosRCyhD4i4xOOMpY+b4N5Ap0e1qs5qVe3n1TxV5xZC5CgTV+DYTpoGZjENn5F0cwvY40Th2ZQk1VhBuSBQfrL1LORmTBJzkz5KwHnW8Q4r+IJ/6IekM6kj/FaSJymlwNLW6Mlqlga/jHOrOeZInHPuXr/gcM4lXyWjCH/cEciTmST5yptI/CVJV/rAy/FrdTPavZl6RGOUpyyTqc+OaIt2X0k2j9xYd+OE59w9kkySVfmNhvCan9R6u+hdro0bKFDLUBoTXUvtmTa0SqFf8KRKRqmokkJDiQK/2k13821vpuz/NLqUEpJHpjy7a/WtGa7GB+dk4r5T3yKpYBnlrSGoD2RSoRJ2vALLaYTf4H0iFJgk/QvX9CRM4Hg5dQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNC0wMS0wOFQyMjoxNToyNyswMDowMNXbtnQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMDEtMDhUMjI6MTU6MjcrMDA6MDCkhg7IAAAAAElFTkSuQmCC"  # noqa: E501

class TestImageUtils(BaseTestCase):
    """
    Test the image utilities
    """
    def test_compressed_to_jpeg(self):
        """
        Tests that the compress_image function produces a JPEG
        """
        image = base64.b64decode(image_base64)
        self.assertEqual(puremagic.from_string(image), '.png')
        compressed = compress_image(image)
        self.assertEqual(puremagic.from_string(compressed), '.jfif')

    def test_compressed_to_jpeg_with_width(self):
        """
        Tests that the compress_image function produces a resized JPEG
        """
        image = base64.b64decode(image_base64)
        self.assertEqual(puremagic.from_string(image), '.png')
        compressed = compress_image(image, 10)
        self.assertEqual(puremagic.from_string(compressed), '.jfif')
        self.assertEqual(Image.open(BytesIO(compressed)).width, 10)

    def test_compressed_to_jpeg_with_less_width(self):
        """
        Tests that the compress_image function produces a resized JPEG
        """
        image = base64.b64decode(image_base64)
        self.assertEqual(puremagic.from_string(image), '.png')
        compressed = compress_image(image, 30)
        self.assertEqual(puremagic.from_string(compressed), '.jfif')
        self.assertEqual(Image.open(BytesIO(compressed)).width, 28)

    def test_can_detect_url_encoded_image(self):
        """
        Tests that the function can detect URL encoded images
        """
        url_encoded_img = f"data:image/png;base64,{image_base64}"
        self.assertTrue(is_url_encoded_image(url_encoded_img))

        fake_encoded_img = f"data:/image/png;base64,Y2x1ZWxlc3M="
        self.assertFalse(is_url_encoded_image(fake_encoded_img))

    def test_preauthenticated_blob_url_generates_tokens(self):
        """
        Ensures that generate_blob_sas is called.
        """
        with patch(
                'core.utils.image_utils.generate_blob_sas'
        ) as m:
            client = MagicMock()
            blob_client = MagicMock()
            client.get_blob_client.return_value = blob_client
            blob_client.url = 'some_url'

            m.return_value = 'test_token'
            token = \
                get_preauthenticated_blob_url(client, 'container_name',
                                              'some_file')
            m.assert_called_once()
            self.assertEqual(token, 'some_url?test_token')
