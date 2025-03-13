#!/usr/bin/env python3
"""
Technology Metrics Generator

This script generates technology performance metrics for contact center systems,
including API integration performance, AI containment rates, and automation effectiveness.
The data covers 3 months of technology metrics for NICE CXone, IEX WFM, and Salesforce integrations.

Author: Contact Center Analytics Team
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os
import uuid
from pathlib import Path

# Ensure reproducibility
np.random.seed(42)
random.seed(42)

# Constants for data generation
START_DATE = datetime(2024, 1, 1)  # Start date
END_DATE = datetime(2024, 3, 31)    # End date (3 months of data)

# Technology definitions
TECHNOLOGIES = [
    {'id': 'TECH-001', 'name': 'NICE CXone', 'category': 'Contact Center Platform'},
    {'id': 'TECH-002', 'name': 'IEX WFM', 'category': 'Workforce Management'},
    {'id': 'TECH-003', 'name': 'Salesforce Service Cloud', 'category': 'CRM'},
    {'id': 'TECH-004', 'name': 'AI Chatbot', 'category': 'Automation'},
    {'id': 'TECH-005', 'name': 'Voice Authentication', 'category': 'Security'},
    {'id': 'TECH-006', 'name': 'SMS Notification', 'category': 'Messaging'},
    {'id': 'TECH-007', 'name': 'Email Automation', 'category': 'Automation'}
]

# Integration types
INTEGRATION_TYPES = ['API', 'Webhook', 'Custom Script', 'Database', 'File Transfer']

# Output directory
OUTPUT_DIR = "../../data/raw"

def generate_date_range(start_date, end_date):
    """Generate a list of dates between start_date and end_date."""
    date_list = []
    current_date = start_date
    while current_date <= end_date:
        date_list.append(current_date)
        current_date += timedelta(days=1)
    return date_list

def generate_transaction_volume(technology, date):
    """
    Generate a realistic transaction volume for a technology.
    Different technologies have different usage patterns.
    """
    # Base volume by technology category
    category_volumes = {
        'Contact Center Platform': 5000,
        'Workforce Management': 1000,
        'CRM': 3000,
        'Automation': 2000,
        'Security': 800,
        'Messaging': 1500
    }
    
    # Get base volume for this technology
    category = technology['category']
    base_volume = category_volumes.get(category, 1000)
    
    # Day of week effect (weekends lower)
    day_of_week = date.weekday()
    if day_of_week >= 5:  # Weekend
        day_factor = 0.4  # 40% of weekday volume
    else:
        day_factor = 1.0
    
    # Random variation (±20%)
    variation = random.uniform(0.8, 1.2)
    
    # Special case for AI Chatbot - growing adoption over time
    if technology['id'] == 'TECH-004':
        days_since_start = (date - START_DATE).days
        max_days = (END_DATE - START_DATE).days
        growth_factor = 1.0 + (0.5 * (days_since_start / max_days))  # Up to 50% growth
        base_volume *= growth_factor
    
    # Calculate final volume
    volume = int(base_volume * day_factor * variation)
    
    return volume

def generate_error_rate(technology, integration_type, date):
    """
    Generate a realistic error rate for technology integration.
    Error rates typically decrease over time with improvements.
    """
    # Base error rates by technology
    base_rates = {
        'TECH-001': 0.03,  # NICE CXone - 3% base error rate
        'TECH-002': 0.02,  # IEX WFM - 2% base error rate
        'TECH-003': 0.025, # Salesforce - 2.5% base error rate
        'TECH-004': 0.05,  # AI Chatbot - 5% base error rate (more complex)
        'TECH-005': 0.01,  # Voice Auth - 1% base error rate (security critical)
        'TECH-006': 0.015, # SMS - 1.5% base error rate
        'TECH-007': 0.03   # Email - 3% base error rate
    }
    
    # Additional rate by integration type
    integration_factors = {
        'API': 1.0,        # Baseline
        'Webhook': 1.2,    # 20% more errors than API
        'Custom Script': 1.4, # 40% more errors than API
        'Database': 0.9,   # 10% fewer errors than API
        'File Transfer': 1.1 # 10% more errors than API
    }
    
    # Get base rate for this technology
    base_rate = base_rates.get(technology['id'], 0.03)
    
    # Apply integration type factor
    integration_factor = integration_factors.get(integration_type, 1.0)
    
    # Time improvement factor - error rates decrease over time
    days_since_start = (date - START_DATE).days
    max_days = (END_DATE - START_DATE).days
    improvement_factor = 1.0 - (0.3 * (days_since_start / max_days))  # Up to 30% reduction
    
    # Random variation (±25%)
    variation = random.uniform(0.75, 1.25)
    
    # Calculate final error rate (minimum 0.5%)
    error_rate = max(0.005, base_rate * integration_factor * improvement_factor * variation)
    
    # Add occasional spikes
    if random.random() < 0.02:  # 2% chance of a spike
        error_rate *= random.uniform(2, 5)  # 2x to 5x spike
    
    # Cap at 20%
    return min(0.2, error_rate)

def generate_response_time(technology, integration_type):
    """
    Generate average response time in milliseconds for technology integration.
    Different technologies and integration types have different performance characteristics.
    """
    # Base response times by technology (in ms)
    base_times = {
        'TECH-001': 150,  # NICE CXone
        'TECH-002': 100,  # IEX WFM
        'TECH-003': 180,  # Salesforce
        'TECH-004': 200,  # AI Chatbot
        'TECH-005': 80,   # Voice Auth (needs to be fast)
        'TECH-006': 90,   # SMS
        'TECH-007': 120   # Email
    }
    
    # Response time multiplier by integration type
    integration_multipliers = {
        'API': 1.0,        # Baseline
        'Webhook': 0.8,    # Webhooks are typically faster
        'Custom Script': 1.3, # Custom scripts can be slower
        'Database': 1.2,   # Database operations can be slower
        'File Transfer': 1.5 # File transfers are slowest
    }
    
    # Get base time for this technology
    base_time = base_times.get(technology['id'], 150)
    
    # Apply integration type multiplier
    multiplier = integration_multipliers.get(integration_type, 1.0)
    
    # Random variation (±30%)
    variation = random.uniform(0.7, 1.3)
    
    # Calculate final response time
    response_time = base_time * multiplier * variation
    
    # Add occasional outliers
    if random.random() < 0.05:  # 5% chance of an outlier
        response_time *= random.uniform(2, 4)  # 2x to 4x slower
    
    return round(response_time, 1)

def generate_containment_rate(technology, date):
    """
    Generate AI containment rate for automation technologies.
    Only applicable for AI/automation technologies.
    """
    # Only certain technologies have containment rates
    if technology['category'] != 'Automation':
        return None
    
    # Base containment rate by technology
    if technology['id'] == 'TECH-004':  # AI Chatbot
        base_rate = 0.60  # 60% base containment
    elif technology['id'] == 'TECH-007':  # Email Automation
        base_rate = 0.50  # 50% base containment
    else:
        base_rate = 0.40  # 40% base containment for other automation
    
    # Time improvement factor - containment improves over time
    days_since_start = (date - START_DATE).days
    max_days = (END_DATE - START_DATE).days
    improvement_factor = (days_since_start / max_days) * 0.15  # Up to 15% improvement
    
    # Random variation (±8%)
    variation = random.uniform(-0.08, 0.08)
    
    # Calculate final containment rate
    containment_rate = base_rate + improvement_factor + variation
    
    # Enforce bounds
    return min(0.90, max(0.30, containment_rate))

def generate_deflection_rate(containment_rate):
    """
    Generate deflection rate based on containment rate.
    Deflection rate is typically slightly lower than containment.
    """
    if containment_rate is None:
        return None
    
    # Deflection is typically 80-95% of containment
    deflection_factor = random.uniform(0.80, 0.95)
    
    return containment_rate * deflection_factor

def calculate_cost_savings(technology, containment_rate, transaction_volume):
    """
    Calculate estimated cost savings from technology implementation.
    Based on containment, deflection, and transaction volume.
    """
    if containment_rate is None:
        # For non-automation technologies, calculate differently
        if technology['category'] == 'Contact Center Platform':
            # Platform efficiencies
            base_savings_per_transaction = 0.02  # $0.02 per transaction
        elif technology['category'] == 'Workforce Management':
            # WFM labor savings
            base_savings_per_transaction = 0.05  # $0.05 per transaction
        elif technology['category'] == 'CRM':
            # CRM efficiency gains
            base_savings_per_transaction = 0.03  # $0.03 per transaction
        else:
            base_savings_per_transaction = 0.01  # $0.01 per transaction
        
        # Apply volume
        savings = transaction_volume * base_savings_per_transaction
    else:
        # For automation technologies, use containment rate
        # Average cost per agent-handled contact
        agent_cost_per_contact = 7.50  # $7.50 per contact
        
        # Automation cost per contact
        automation_cost_per_contact = 0.75  # $0.75 per contact
        
        # Cost savings per contained contact
        savings_per_contained = agent_cost_per_contact - automation_cost_per_contact
        
        # Apply containment rate to get total savings
        contained_contacts = transaction_volume * containment_rate
        savings = contained_contacts * savings_per_contained
    
    # Random variation (±15%)
    variation = random.uniform(0.85, 1.15)
    
    return round(savings * variation, 2)

def generate_technology_metrics(start_date, end_date):
    """
    Generate a dataset of daily technology performance metrics.
    
    Args:
        start_date: Start date for the data generation
        end_date: End date for the data generation
        
    Returns:
        pandas.DataFrame: DataFrame containing the generated metrics
    """
    print(f"Generating technology metrics from {start_date} to {end_date}...")
    
    # Generate all dates in the range
    dates = generate_date_range(start_date, end_date)
    
    # List to hold all records
    all_records = []
    
    # Generate records for each technology for each date
    record_count = 0
    for date in dates:
        for technology in TECHNOLOGIES:
            # For each technology, generate metrics for multiple integration types
            # The number of integration types varies by technology
            if technology['category'] == 'Contact Center Platform':
                # Platforms have more integration types
                int_types = INTEGRATION_TYPES
            elif technology['category'] == 'Automation':
                # Automation has fewer integration types
                int_types = ['API', 'Webhook', 'Custom Script']
            else:
                # Other technologies have a mix
                int_types = random.sample(INTEGRATION_TYPES, random.randint(2, 4))
            
            for integration_type in int_types:
                # Generate transaction volume
                transaction_volume = generate_transaction_volume(technology, date)
                
                # Generate error rate
                error_rate = generate_error_rate(technology, integration_type, date)
                
                # Calculate successful and failed transactions
                failed_transactions = int(transaction_volume * error_rate)
                successful_transactions = transaction_volume - failed_transactions
                
                # Generate response time
                avg_response_time = generate_response_time(technology, integration_type)
                
                # Generate containment and deflection rates (for automation only)
                containment_rate = generate_containment_rate(technology, date)
                deflection_rate = generate_deflection_rate(containment_rate)
                
                # Calculate cost savings
                cost_savings = calculate_cost_savings(technology, containment_rate, transaction_volume)
                
                # Create the record
                record = {
                    'metric_id': f"TM-{record_count + 10000}",
                    'date': date.strftime('%Y-%m-%d'),
                    'technology_id': technology['id'],
                    'technology_name': technology['name'],
                    'technology_category': technology['category'],
                    'integration_type': integration_type,
                    'successful_transactions': successful_transactions,
                    'failed_transactions': failed_transactions,
                    'average_response_time_ms': avg_response_time,
                    'error_rate': round(error_rate * 100, 2),  # Convert to percentage
                    'containment_rate': round(containment_rate * 100, 2) if containment_rate is not None else None,
                    'deflection_rate': round(deflection_rate * 100, 2) if deflection_rate is not None else None,
                    'cost_savings': cost_savings
                }
                
                all_records.append(record)
                record_count += 1
            
        # Show progress periodically
        if date.day == 1 or date.day == 15:
            print(f"Generated metrics through {date.strftime('%Y-%m-%d')}...")
    
    # Convert to DataFrame
    df = pd.DataFrame(all_records)
    
    # Add occasional outliers for realism
    df = add_outliers_and_trends(df)
    
    print(f"Generated {len(df)} technology metric records.")
    return df

def add_outliers_and_trends(df):
    """
    Add occasional outliers and time-based trends to the data.
    This simulates real-world technology fluctuations and improvements.
    """
    # Add system outage simulation (drastically increased error rates)
    outage_indices = df.sample(frac=0.005).index  # 0.5% of records have "outages"
    df.loc[outage_indices, 'error_rate'] = df.loc[outage_indices, 'error_rate'] * random.uniform(5, 10)
    df.loc[outage_indices, 'average_response_time_ms'] = df.loc[outage_indices, 'average_response_time_ms'] * random.uniform(3, 8)
    
    # Cap error rate at 100%
    df['error_rate'] = df['error_rate'].apply(lambda x: min(100, x))
    
    # Add performance improvement trend for response time
    df['date'] = pd.to_datetime(df['date'])
    days_since_start = (df['date'] - pd.to_datetime(START_DATE)).dt.days
    max_days = (END_DATE - START_DATE).days
    
    # Improvement factor increases over time
    improvement_factor = days_since_start / max_days
    
    # Apply gradual improvement to response time (up to 20% reduction)
    response_time_reduction = 0.2 * improvement_factor
    df['average_response_time_ms'] = df['average_response_time_ms'] * (1 - response_time_reduction)
    
    # Format date back to string
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')
    
    # Round relevant columns
    df['average_response_time_ms'] = df['average_response_time_ms'].round(1)
    df['error_rate'] = df['error_rate'].round(2)
    if 'containment_rate' in df.columns:
        df['containment_rate'] = df['containment_rate'].fillna(0).round(2)
    if 'deflection_rate' in df.columns:
        df['deflection_rate'] = df['deflection_rate'].fillna(0).round(2)
    
    return df

def save_data(df, filename="technology_metrics.csv"):
    """Save the generated data to a CSV file."""
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Save to CSV
    output_path = os.path.join(OUTPUT_DIR, filename)
    df.to_csv(output_path, index=False)
    print(f"Data saved to {output_path}")
    
    # Also save a sample for quick inspection
    sample = df.sample(min(1000, len(df)))
    sample_path = os.path.join(OUTPUT_DIR, f"sample_{filename}")
    sample.to_csv(sample_path, index=False)
    print(f"Sample saved to {sample_path}")
    
    return output_path

def main():
    """Main function to generate and save technology metrics data."""
    # Generate the data
    df = generate_technology_metrics(START_DATE, END_DATE)
    
    # Save the data
    save_data(df)
    
    print("Technology metrics generation complete.")

if __name__ == "__main__":
    main()
