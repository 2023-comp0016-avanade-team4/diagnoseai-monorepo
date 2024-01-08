"""
Module to test image utilities
"""

import unittest
import base64
import puremagic  # type: ignore[import-untyped]
from core.utils.image_utils import compress_image


class TestImageUtils(unittest.TestCase):
    """
    Test the image utilities
    """
    def test_compressed_to_jpeg(self):
        """
        Tests that the compress_image function produces a JPEG
        """

        # this image is base64 encoded PNG
        image_base64 = "iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAQAAADYBBcfAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfoAQgWDyUaICVaAAAEPElEQVQ4y12Ua4iUZRTH/+e97Mw0OzM7e9PddRXNWybebQ3UVrEkqSwSkwKRioI+JKF9KMsEIQhFMAyhDwUVpH3IC2ptaIhiIBmuIZm56wVveaF119vOvO/7/PqwY2jncOD58Jzb/3/O8SWzBYbuei1eL7IndE4PStpChV7KcqQsryr1S5JMJvIWeHOT3uByquuxpK3qbjzcjaaMeYH9Xf5dUXhw9h/7XNF3LnJmt5EkpZTxzJNGNlV9lruWjQOEMDzEUp5jIm1uGE1f5moDNVjO6lQ3UEi9L/swHa5Sz2xeQq45Whntijvjb+KH4+FxfTwumpOMdQ+RPVO9pzg3p5zfYoEkVatujI5NZAeb3GD3Kts4wAFOAFe4wVlmIzJkXTYpUvNijfJVvvImqXVM6rd5lOLdLmQqK2nCCMmzAehhPRlStJKjPkmRO9w6epia/UFqNNmaCRBtJaRAEUNsBJYTcodl+HQwizxiLStdlmJncYQ0yHtaUscrfOBEljzLmM8G+tnOEKaQsAixlW62soOrHKYYiZofJHkjTdq/mktJJ52008gLtNNAgVVcJuEqn5KllhaaaUIsYlc8AvtIKvimk++N/piSpdSrjboh06Nq1wjFkky+zuukSpKkjCao3r3lbT6qKS2mfPQrjlv0s51TQAI4SkTERJRwgGNAImAXut0yo1Y26M6RTLNKyqhNOe2Ur5SQ/TdwyBTrqo7rZ8Xy1Oa2eN/vd3Os9taebJsihdqnZ2SarhVKV1yR1K/P1a2zQuM0SGdUYp0tvVY/STq4GFyEAw6xhnGkqCYkJCSgmiyLWcEmDgGbaWIKf9JI1Uz5bw/hagJlyjigl+v0cKOiPVynXOn8LzLM4zh3XStarpah6n4fXB8RjugBMAZeAyBBBz7XSYA30Wn5yr5e5EKcUAIcjuR/6nDEQAdpLnMH2Ev6opdV67aeC+/6vSSVBfUq5uRk9+F7W6a0MpJ61Z9V6AUaPEu3v67w9GCZSYVXR8R4nhpg001DW1VjBV/Sd5M5FUO58g0S1rKFhIR++oHDiJ1AQhc1+AskNXiTNG2Mjj4PSamSAcosRCyhD4i4xOOMpY+b4N5Ap0e1qs5qVe3n1TxV5xZC5CgTV+DYTpoGZjENn5F0cwvY40Th2ZQk1VhBuSBQfrL1LORmTBJzkz5KwHnW8Q4r+IJ/6IekM6kj/FaSJymlwNLW6Mlqlga/jHOrOeZInHPuXr/gcM4lXyWjCH/cEciTmST5yptI/CVJV/rAy/FrdTPavZl6RGOUpyyTqc+OaIt2X0k2j9xYd+OE59w9kkySVfmNhvCan9R6u+hdro0bKFDLUBoTXUvtmTa0SqFf8KRKRqmokkJDiQK/2k13821vpuz/NLqUEpJHpjy7a/WtGa7GB+dk4r5T3yKpYBnlrSGoD2RSoRJ2vALLaYTf4H0iFJgk/QvX9CRM4Hg5dQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNC0wMS0wOFQyMjoxNToyNyswMDowMNXbtnQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMDEtMDhUMjI6MTU6MjcrMDA6MDCkhg7IAAAAAElFTkSuQmCC"  # noqa: E501

        image = base64.b64decode(image_base64)
        self.assertEqual(puremagic.from_string(image), '.png')
        compressed = compress_image(image)
        self.assertEqual(puremagic.from_string(compressed), '.jfif')
