"""
Google Sheets Client for AQI Alert Subscriptions

This module handles storing and retrieving user subscriptions for daily AQI alerts.
Uses Google Sheets as a simple, free database for MVP.

Setup Instructions:
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable Google Sheets API: APIs & Services > Enable APIs > Search "Google Sheets API" > Enable
4. Enable Google Drive API: APIs & Services > Enable APIs > Search "Google Drive API" > Enable
5. Create Service Account: IAM & Admin > Service Accounts > Create
   - Give it a name like "aqi-sheets-writer"
   - Skip optional permissions
   - Create key (JSON format) - this downloads a file
6. Create a Google Sheet manually and share it with the service account email
   (found in the JSON file as "client_email")
7. Copy the Sheet ID from the URL: docs.google.com/spreadsheets/d/{SHEET_ID}/edit
8. Set environment variables:
   - GOOGLE_SHEETS_CREDENTIALS_JSON: The entire JSON content (for Cloud Run)
   - GOOGLE_SHEET_ID: The spreadsheet ID
"""

import os
import json
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Google Sheets dependencies - optional, graceful fallback if not installed
try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    SHEETS_AVAILABLE = True
except ImportError:
    SHEETS_AVAILABLE = False
    logger.warning("Google Sheets libraries not installed. Run: pip install google-auth google-api-python-client")


# Configuration
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SHEET_NAME = 'Subscriptions'  # Tab name in the spreadsheet


def get_sheets_service():
    """
    Create and return a Google Sheets service instance.
    
    Returns None if credentials are not configured.
    """
    if not SHEETS_AVAILABLE:
        logger.warning("Google Sheets libraries not available")
        return None
    
    # Try to get credentials from environment
    creds_json = os.getenv('GOOGLE_SHEETS_CREDENTIALS_JSON')
    
    if not creds_json:
        # Try loading from file (local development)
        creds_file = os.getenv('GOOGLE_SHEETS_CREDENTIALS_FILE', 'credentials.json')
        if os.path.exists(creds_file):
            with open(creds_file, 'r') as f:
                creds_json = f.read()
        else:
            logger.warning(f"No Google Sheets credentials found. Set GOOGLE_SHEETS_CREDENTIALS_JSON env var or create {creds_file}")
            return None
    
    try:
        creds_dict = json.loads(creds_json)
        credentials = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
        service = build('sheets', 'v4', credentials=credentials)
        return service
    except Exception as e:
        logger.error(f"Failed to create Sheets service: {e}")
        return None


def get_sheet_id() -> Optional[str]:
    """Get the Google Sheet ID from environment."""
    sheet_id = os.getenv('GOOGLE_SHEET_ID')
    if not sheet_id:
        logger.warning("GOOGLE_SHEET_ID environment variable not set")
    return sheet_id


def ensure_headers(service, spreadsheet_id: str) -> bool:
    """
    Ensure the spreadsheet has the correct headers.
    Creates headers if the sheet is empty.
    """
    try:
        # Check if headers exist
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f'{SHEET_NAME}!A1:H1'
        ).execute()
        
        values = result.get('values', [])
        
        if not values:
            # Add headers
            headers = [[
                'ID',
                'Method',
                'Contact',
                'Location',
                'Latitude',
                'Longitude',
                'Created At',
                'Status'
            ]]
            
            service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=f'{SHEET_NAME}!A1:H1',
                valueInputOption='RAW',
                body={'values': headers}
            ).execute()
            
            logger.info("Created headers in spreadsheet")
        
        return True
        
    except HttpError as e:
        if e.resp.status == 400 and 'Unable to parse range' in str(e):
            # Sheet tab doesn't exist, try to create it
            try:
                service.spreadsheets().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body={
                        'requests': [{
                            'addSheet': {
                                'properties': {'title': SHEET_NAME}
                            }
                        }]
                    }
                ).execute()
                # Retry adding headers
                return ensure_headers(service, spreadsheet_id)
            except Exception as create_err:
                logger.error(f"Failed to create sheet tab: {create_err}")
                return False
        logger.error(f"Failed to ensure headers: {e}")
        return False


def add_subscription(
    method: str,
    contact: str,
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> dict:
    """
    Add a new subscription to the Google Sheet.
    
    Args:
        method: 'email' or 'phone'
        contact: Email address or phone number
        location: Location name/description
        latitude: Optional latitude coordinate
        longitude: Optional longitude coordinate
    
    Returns:
        dict with 'success' boolean and 'message' or 'error'
    """
    service = get_sheets_service()
    sheet_id = get_sheet_id()
    
    if not service or not sheet_id:
        # Fallback: log the subscription attempt
        logger.info(f"[FALLBACK] Subscription request: {method}={contact}, location={location}")
        return {
            'success': True,
            'message': 'Subscription recorded (fallback mode)',
            'fallback': True
        }
    
    try:
        # Ensure headers exist
        if not ensure_headers(service, sheet_id):
            return {'success': False, 'error': 'Failed to initialize spreadsheet'}
        
        # Generate a simple ID
        subscription_id = f"SUB_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Prepare row data
        row = [[
            subscription_id,
            method,
            contact,
            location or 'Unknown',
            str(latitude) if latitude else '',
            str(longitude) if longitude else '',
            datetime.utcnow().isoformat(),
            'active'
        ]]
        
        # Append to sheet
        result = service.spreadsheets().values().append(
            spreadsheetId=sheet_id,
            range=f'{SHEET_NAME}!A:H',
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body={'values': row}
        ).execute()
        
        logger.info(f"Added subscription: {subscription_id}")
        
        return {
            'success': True,
            'message': 'Successfully subscribed to daily AQI alerts!',
            'subscription_id': subscription_id
        }
        
    except HttpError as e:
        logger.error(f"Google Sheets API error: {e}")
        return {'success': False, 'error': f'Failed to save subscription: {str(e)}'}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {'success': False, 'error': 'An unexpected error occurred'}


def check_subscription_exists(contact: str) -> bool:
    """
    Check if a subscription already exists for this contact.
    
    Args:
        contact: Email address or phone number
    
    Returns:
        True if subscription exists, False otherwise
    """
    service = get_sheets_service()
    sheet_id = get_sheet_id()
    
    if not service or not sheet_id:
        return False
    
    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range=f'{SHEET_NAME}!C:C'
        ).execute()
        
        values = result.get('values', [])
        contacts = [row[0] for row in values if row]
        
        return contact in contacts
        
    except Exception as e:
        logger.error(f"Error checking subscription: {e}")
        return False


def get_all_subscriptions() -> list:
    """
    Get all active subscriptions from the sheet.
    
    Returns:
        List of subscription dictionaries
    """
    service = get_sheets_service()
    sheet_id = get_sheet_id()
    
    if not service or not sheet_id:
        return []
    
    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=sheet_id,
            range=f'{SHEET_NAME}!A:H'
        ).execute()
        
        values = result.get('values', [])
        
        if len(values) <= 1:  # Only headers or empty
            return []
        
        headers = values[0]
        subscriptions = []
        
        for row in values[1:]:
            # Pad row to match headers length
            row = row + [''] * (len(headers) - len(row))
            sub = dict(zip(headers, row))
            if sub.get('Status') == 'active':
                subscriptions.append(sub)
        
        return subscriptions
        
    except Exception as e:
        logger.error(f"Error getting subscriptions: {e}")
        return []


# ============================================================
# Feedback Functions
# ============================================================

FEEDBACK_SHEET_NAME = 'Feedback'


def ensure_feedback_headers(service, spreadsheet_id: str) -> bool:
    """
    Ensure the Feedback sheet has the correct headers.
    Creates headers if the sheet is empty.
    """
    try:
        # Check if headers exist
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f'{FEEDBACK_SHEET_NAME}!A1:G1'
        ).execute()
        
        values = result.get('values', [])
        
        if not values:
            # Add headers
            headers = [[
                'ID',
                'Rating',
                'Feedback',
                'Location',
                'Latitude',
                'Longitude',
                'Created At'
            ]]
            
            service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=f'{FEEDBACK_SHEET_NAME}!A1:G1',
                valueInputOption='RAW',
                body={'values': headers}
            ).execute()
            
            logger.info("Created headers in Feedback sheet")
        
        return True
        
    except HttpError as e:
        if e.resp.status == 400 and 'Unable to parse range' in str(e):
            # Sheet tab doesn't exist, try to create it
            try:
                service.spreadsheets().batchUpdate(
                    spreadsheetId=spreadsheet_id,
                    body={
                        'requests': [{
                            'addSheet': {
                                'properties': {'title': FEEDBACK_SHEET_NAME}
                            }
                        }]
                    }
                ).execute()
                # Retry adding headers
                return ensure_feedback_headers(service, spreadsheet_id)
            except Exception as create_err:
                logger.error(f"Failed to create Feedback sheet tab: {create_err}")
                return False
        logger.error(f"Failed to ensure feedback headers: {e}")
        return False


def add_feedback(
    rating: int,
    feedback: str = '',
    location: str = '',
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> dict:
    """
    Add feedback to the Google Sheet.
    
    Args:
        rating: Star rating 1-5
        feedback: Optional text feedback
        location: Location name/description
        latitude: Optional latitude coordinate
        longitude: Optional longitude coordinate
    
    Returns:
        dict with 'success' boolean and 'message' or 'error'
    """
    service = get_sheets_service()
    sheet_id = get_sheet_id()
    
    if not service or not sheet_id:
        # Fallback: log the feedback
        logger.info(f"[FALLBACK] Feedback: rating={rating}, feedback={feedback}, location={location}")
        return {
            'success': True,
            'message': 'Feedback recorded (fallback mode)',
            'fallback': True
        }
    
    try:
        # Ensure headers exist
        if not ensure_feedback_headers(service, sheet_id):
            return {'success': False, 'error': 'Failed to initialize feedback sheet'}
        
        # Generate a simple ID
        from datetime import timezone
        feedback_id = f"FB_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        
        # Prepare row data
        row = [[
            feedback_id,
            str(rating),
            feedback or '',
            location or 'Unknown',
            str(latitude) if latitude else '',
            str(longitude) if longitude else '',
            datetime.now(timezone.utc).isoformat()
        ]]
        
        # Append to sheet
        result = service.spreadsheets().values().append(
            spreadsheetId=sheet_id,
            range=f'{FEEDBACK_SHEET_NAME}!A:G',
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body={'values': row}
        ).execute()
        
        logger.info(f"Added feedback: {feedback_id}")
        
        return {
            'success': True,
            'message': 'Thank you for your feedback!',
            'feedback_id': feedback_id
        }
        
    except HttpError as e:
        logger.error(f"Google Sheets API error: {e}")
        return {'success': False, 'error': f'Failed to save feedback: {str(e)}'}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {'success': False, 'error': 'An unexpected error occurred'}
