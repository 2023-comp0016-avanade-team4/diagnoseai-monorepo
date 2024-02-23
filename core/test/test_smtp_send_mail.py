"""
Testing all functions in smtp_send_mail
"""

import unittest
from email.mime.multipart import MIMEMultipart
from smtplib import SMTPException
from unittest.mock import patch

from core.utils.smtp_send_mail import (create_mail, create_mail_text,
                                       make_validation_link,
                                       send_file_processed_mail, send_mail)


class TestSendMail(unittest.TestCase):
    """
    Tests the functions in send_mail.py
    """

    def setUp(self):
        user = "John Doe"
        email = "johndoe@example.com"
        filename = "someindex"
        validation_link = "https://example.com/validate?index=someindex"
        self.standard_mail = create_mail(user, email, filename,
                                         validation_link)

    def test_make_validation_link(self):
        """
        Tests the make_validation_link function
        """
        base_url = "https://example.com"
        filename = "someindex"
        self.assertEqual(make_validation_link(base_url, filename),
                         "https://example.com/validate?index=someindex")

    def test_create_mail_text(self):
        """
        Tests the create_mail_text function
        """
        user = "John Doe"
        filename = "someindex"
        validation_link = "https://example.com/validate?index=someindex"

        res = create_mail_text(user, filename, validation_link)
        self.assertIn(user, res)
        self.assertIn(filename, res)
        self.assertIn(validation_link, res)

    def test_create_mail(self):
        """
        Tests the create_mail function
        """
        user = "John Doe"
        email = "johndoe@example.com"
        filename = "someindex"
        validation_link = "https://example.com/validate?index=someindex"

        res = create_mail(user, email, filename, validation_link)
        self.assertIsInstance(res, MIMEMultipart)
        self.assertEqual(res['From'], 'noreply@diagnoseai.com')
        self.assertEqual(res['To'], email)
        self.assertEqual(res['Subject'],
                         "DiagnoseAI - File Processed Successfully")
        self.assertIn(user, res.as_string())
        self.assertIn(filename, res.as_string())
        self.assertIn(validation_link, res.as_string())

    @patch('smtplib.SMTP')
    def test_send_mail(self, mock_smtp):
        """
        Tests the send_mail function
        """
        send_mail("smtp.example.com", "someuser", "somepassword",
                  self.standard_mail)

        mock_smtp.assert_called()
        mock_smtp.return_value.starttls.assert_called()
        mock_smtp.return_value.login.assert_called()
        mock_smtp.return_value.sendmail.assert_called()
        mock_smtp.return_value.quit.assert_called()

    @patch('smtplib.SMTP')
    def test_send_mail_error(self, mock_smtp):
        """
        Tests the send_mail function when an error occurs
        """
        mock_smtp.return_value.sendmail.side_effect = SMTPException
        send_mail("smtp.example.com", "someuser", "somepassword",
                  self.standard_mail)

        mock_smtp.assert_called()
        mock_smtp.return_value.starttls.assert_called()
        mock_smtp.return_value.login.assert_called()
        mock_smtp.return_value.sendmail.assert_called()
        mock_smtp.return_value.quit.assert_not_called()

    @patch('core.utils.smtp_send_mail.create_mail')
    @patch('core.utils.smtp_send_mail.send_mail')
    def test_send_mail_integration(self, mock_send_mail, mock_create_mail):
        """
        Tests the send_mail function with integration
        """
        username = "notification.bot"
        password = "notification.bot.password"
        base_url = "https://example.com"
        filename = "someindex"
        target_username = "johndoe"
        target_email = "johndoe@example.com"

        send_file_processed_mail("smtp.example.com", username,
                                 password, base_url, filename,
                                 target_username, target_email)

        mock_create_mail.assert_called()
        mock_send_mail.assert_called()
