"""
Testing the get_image_summary function in image_summary.py
"""

import unittest
from unittest.mock import Mock, patch
from core.utils.image_summary import ImageSummary

post_patch = patch('requests.post')
loads_patch = patch('json.loads')


class TestImageSummary(unittest.TestCase):
    """
    Tests the get_image_summary function in image_summary.py
    """

    def setUp(self):
        # These patches have side effects, and should be separately
        # started / stopped
        self.post_patch = post_patch.start()
        self.loads_patch = loads_patch.start()
        self.img_summary = ImageSummary(
            "mock_base",
            "mock_key",
            "mock_deployment"
        )

    def tearDown(self):
        post_patch.stop()
        loads_patch.stop()

    def test_get_image_summary(self):
        """
        Trivial test for get_image_summary
        """
        image = "data:image/"
        mock_response = {'choices': [{'message': {'content': 'mock_content'}}]}
        self.post_patch.return_value = Mock()
        self.loads_patch.return_value = mock_response
        self.assertEqual(self.img_summary.get_image_summary(image),
                         "mock_content")
        self.post_patch.assert_called()
        self.loads_patch.assert_called()

    def test_get_image_summary_no_response(self):
        """
        Tests that get_image_summary returns an error message when
        there is no response
        """
        image = "data:image/"
        mock_response = {'choices': [{'message': {'content': None}}]}
        self.post_patch.return_value = Mock()
        self.loads_patch.return_value = mock_response
        with self.assertRaisesRegex(
                RuntimeError,
                "No response generated by GPT-4 Vision. Please try again."):
            self.img_summary.get_image_summary(image)
        self.post_patch.assert_called()
        self.loads_patch.assert_called()

    def test_get_image_summary_invalid_image(self):
        """
        Tests that get_image_summary returns an error message when the
        image is invalid
        """
        image = "invalid_image"
        with self.assertRaisesRegex(
                RuntimeError,
                "Image string is not valid. "
                "Please try again with a valid Image."):
            self.img_summary.get_image_summary(image)
