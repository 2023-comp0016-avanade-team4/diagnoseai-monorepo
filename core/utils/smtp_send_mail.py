"""
Utilities to send emails to users via SMTP.

Primarily used to inform users that an uploaded file has been
processed successfully.

Designed for Google Mail, but should also work with Azure
Communication Services; at the time of writing (2024-02-23), the
developers did not have access to create communication subscriptions.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

MAIL_TEMPLATE = """
Hello {name},

The uploaded file, {filename} has been processed successfully.

You can now validate the file by visiting the following link:
{validation_link}

Best Regards,
DiagnoseAI

(This is an automatically generated email. Please do not reply to this email.)
"""


def make_validation_link(base_url: str, filename: str, machine_id: str) -> str:
    """
    Creates a validation link based on filename given.

    Args:
        base_url (str): The base URL of the server.
        filename (str): The name of the file to be validated.
        machine_id (str): The machine ID of the user.

    Returns:
        str: The validation link.
    """
    return f"{base_url}/validate?index={filename}&machine={machine_id}"


def create_mail_text(user: str, filename: str, validation_link: str) -> str:
    """
    Creates the text of the email to be sent to the user.

    Args:
        user (str): The name of the user.
        filename (str): The name of the file that was processed.
        validation_link (str): The link to validate the file.

    Returns:
        str: The text of the email to be sent.
    """
    return MAIL_TEMPLATE.format(name=user,
                                filename=filename,
                                validation_link=validation_link)


def create_mail(user: str,
                email: str,
                filename: str,
                validation_link: str) -> MIMEMultipart:
    """
    Creates an email to be sent to the user.

    Args:
        user (str): The name of the user.
        email (str): The email address of the user.
        filename (str): The name of the file that was processed.
        validation_link (str): The link to validate the file.

    Returns:
        MIMEMultipart: The email to be sent.
    """
    mail = MIMEMultipart()
    mail['From'] = 'noreply@diagnoseai.com'
    mail['To'] = email
    mail['Subject'] = "DiagnoseAI - File Processed Successfully"
    mail.attach(MIMEText(create_mail_text(user, filename, validation_link),
                         'plain'))
    return mail


def send_mail(server: str,
              username: str,
              password: str,
              mail: MIMEMultipart):
    """
    Sends an email to the given email address. The function
    intentionally does not return anything. All errors are caught by
    this function.

    Args:
        server (str): The SMTP server to use.
        username (str): The username to use for the SMTP server.
        password (str): The password to use for the SMTP server.
        mail (MIMEMultipart): The email to be sent.
    """
    try:
        remote = smtplib.SMTP(server, 587)
        remote.starttls()
        remote.login(username, password)
        remote.sendmail(mail['From'], mail['To'], mail.as_string())
        remote.quit()
    except smtplib.SMTPException as e:
        logging.info("Error whle sending email: %s.\nEmail not sent.", e)


def send_file_processed_mail(server: str,  # pylint: disable=too-many-arguments
                             username: str,
                             password: str,
                             base_url: str,
                             filename: str,
                             target_username: str,
                             target_email: str,
                             target_machine_id: str):
    """
    Sends an email to the user informing them that the file has been
    processed successfully.

    Args:
        server (str): The SMTP server to use.
        username (str): The username to use for the SMTP server.
        password (str): The password to use for the SMTP server.
        base_url (str): The base URL of the validation page.
        filename (str): The name of the file that was processed.
        target_username (str): The name of the user.
        target_email (str): The email address of the user.
        target_machine_id (str): The machine ID of the user.
    """
    validation_link = make_validation_link(base_url, filename,
                                           target_machine_id)
    mail = create_mail(target_username, target_email, filename,
                       validation_link)
    send_mail(server, username, password, mail)
