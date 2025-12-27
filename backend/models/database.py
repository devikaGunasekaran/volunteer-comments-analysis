"""
Database utilities module
Handles MySQL connections and query helpers
"""
import mysql.connector
from mysql.connector import Error
from backend.config import Config


def get_db_connection():
    """
    Create and return a MySQL database connection
    
    Returns:
        mysql.connector.connection.MySQLConnection or None
    """
    try:
        conn = mysql.connector.connect(**Config.get_db_config())
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


def fetchone_dict(query, params=()):
    """
    Execute query and fetch one row as dictionary
    
    Args:
        query (str): SQL query
        params (tuple): Query parameters
        
    Returns:
        dict or None: Single row as dictionary
    """
    conn = get_db_connection()
    if not conn:
        return None
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row


def fetchall_dict(query, params=()):
    """
    Execute query and fetch all rows as list of dictionaries
    
    Args:
        query (str): SQL query
        params (tuple): Query parameters
        
    Returns:
        list: List of dictionaries
    """
    conn = get_db_connection()
    if not conn:
        return []
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def execute_query(query, params=(), commit=True):
    """
    Execute a query (INSERT, UPDATE, DELETE)
    
    Args:
        query (str): SQL query
        params (tuple): Query parameters
        commit (bool): Whether to commit the transaction
        
    Returns:
        int or None: Last inserted ID or affected rows
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        if commit:
            conn.commit()
        
        last_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return last_id
    except Error as e:
        print(f"Error executing query: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return None
