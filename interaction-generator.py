#!/usr/bin/env python3
"""
Interaction Data Generator

This script generates interaction data for a contact center,
including customer interactions across multiple channels (voice, chat, email, self-service).
The data follows realistic patterns for a contact center with 40-50 agents over a 3-month period.

Author: Contact Center Analytics Team
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os
import uuid
import json
from pathlib import Path

# Ensure reproducibility
np.random.seed(42)
random.seed(42)

# Constants for data generation
CHANNELS = ['Voice', 'Chat', 'Email', 'Self-Service']
CHANNEL_WEIGHTS = [0.45, 0.30, 0.15, 0.10]  # Distribution of channels
INTENT_CATEGORIES = [
    'Account_Update', 'Billing_Question', 'Technical_Support', 
    'Product_Information', 'Order_Status', 'Complaint', 
    'Return_Request', 'General_Inquiry', 'Password_Reset'
]
RESOLUTION_STATUSES = ['Resolved', 'Escalated', 'Follow-Up']
RESOLUTION_WEIGHTS = [0.75, 0.15, 0.10]  # Most interactions are resolved

# Agent and queue data
NUM_AGENTS = 45  # Number of agents in the contact center
NUM_QUEUES = 10  # Number of queues
AGENTS = [f"A{str(i).zfill(3)}" for i in range(1, NUM_AGENTS + 1)]
QUEUES = [f"Q{str(i).zfill(3)}" for i in range(1, NUM_QUEUES + 1)]

# Define date range for 3 months of data
START_DATE = datetime(2024, 1, 1)  # Start date
END_DATE = datetime(2024, 3, 31)    # End date (3 months of data)

# Output directory
OUTPUT_DIR = "../../data/raw"

def generate_customer_id():
    """Generate a random customer ID."""
    return f"C{random.randint(1000, 9999)}"

def generate_timestamp(start_date, end_date):
    """
    Generate a random timestamp within a date range,
    with higher probability during business hours and weekdays.
    """
    # Random date within range
    days_range = (end_date - start_date).days
    random_day = random.randint(0, days_range)
    date = start_date + timedelta(days=random_day)
    
    # Time distribution - higher probability during business hours
    hour_weights = [
        0.01, 0.01, 0.01, 0.01, 0.01,  # 12am-5am (very low)
        0.02, 0.03, 0.05, 0.07, 0.09,  # 5am-10am (increasing)
        0.10, 0.10, 0.09, 0.09, 0.09,  # 10am-3pm (peak)
        0.08, 0.07, 0.06, 0.04, 0.03,  # 3pm-8pm (decreasing)
        0.02, 0.01, 0.01, 0.01         # 8pm-12am (low)
    ]
    # Normalize weights to ensure they sum to 1
    hour_weights = [w/sum(hour_weights) for w in hour_weights]
    
    hour = np.random.choice(range(24), p=hour_weights)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    
    timestamp = datetime(date.year, date.month, date.day, hour, minute, second)
    
    # Apply day of week adjustment (fewer contacts on weekends)
    day_of_week = timestamp.weekday()  # 0-6 (Monday to Sunday)
    if day_of_week >= 5:  # Weekend
        # 70% chance to reject weekend timestamps and try again
        if random.random() < 0.7:
            return generate_timestamp(start_date, end_date)
    
    return timestamp

def generate_wait_time(channel):
    """
    Generate a realistic wait time based on channel.
    Different channels have different wait time patterns.
    """
    if channel == 'Voice':
        # Voice has higher wait times with occasional spikes
        wait_time = max(0, np.random.lognormal(mean=3.0, sigma=0.8))
        return min(int(wait_time), 600)  # Cap at 10 minutes
    
    elif channel == 'Chat':
        # Chat typically has medium wait times
        wait_time = max(0, np.random.lognormal(mean=2.8, sigma=0.7))
        return min(int(wait_time), 300)  # Cap at 5 minutes
    
    elif channel == 'Email':
        # Email can have very long "wait" times (response times)
        # But we'll measure the queue time until assignment
        wait_time = max(0, np.random.lognormal(mean=2.0, sigma=1.2))
        return min(int(wait_time), 120)  # Cap at 2 minutes for queue time
    
    else:  # Self-Service
        # Self-service has minimal wait times
        return max(0, int(np.random.exponential(scale=3)))

def generate_handle_time(channel, intent):
    """
    Generate a realistic handle time based on channel and intent.
    Different channels and intents have different handling patterns.
    """
    # Base handle time multipliers by channel
    channel_multipliers = {
        'Voice': 1.0,
        'Chat': 1.3,  # Chats typically take longer
        'Email': 1.5,  # Emails take longest
        'Self-Service': 0.4  # Self-service is quickest
    }
    
    # Base handle time adjustments by intent
    intent_multipliers = {
        'Account_Update': 1.2,
        'Billing_Question': 1.3,
        'Technical_Support': 1.5,
        'Product_Information': 0.9,
        'Order_Status': 0.7,
        'Complaint': 1.4,
        'Return_Request': 1.1,
        'General_Inquiry': 0.8,
        'Password_Reset': 0.6
    }
    
    # Base handle time (seconds) - log-normal distribution
    base_time = np.random.lognormal(mean=5.0, sigma=0.4)
    
    # Apply multipliers
    adjusted_time = base_time * channel_multipliers[channel] * intent_multipliers[intent]
    
    # Convert to integer seconds
    handle_time = int(adjusted_time)
    
    # Apply caps based on channel
    caps = {
        'Voice': 1800,  # 30 minutes
        'Chat': 2400,   # 40 minutes
        'Email': 3600,  # 60 minutes
        'Self-Service': 900  # 15 minutes
    }
    
    return min(handle_time, caps[channel])

def generate_hold_time(channel, handle_time):
    """
    Generate hold time based on channel and handle time.
    Only voice calls typically have hold time.
    """
    if channel != 'Voice':
        return 0
    
    # Probability of having a hold at all
    if random.random() > 0.4:  # 40% chance of having hold time
        return 0
    
    # Hold time is correlated with handle time
    hold_ratio = random.uniform(0.05, 0.3)  # Hold is 5-30% of handle time
    return int(handle_time * hold_ratio)

def generate_wrap_up_time(channel):
    """Generate realistic wrap-up time based on channel."""
    if channel == 'Voice':
        return max(10, int(np.random.exponential(scale=45)))  # Voice needs more wrap-up
    elif channel == 'Chat':
        return max(10, int(np.random.exponential(scale=40)))  # Chat similar to voice
    elif channel == 'Email':
        return max(5, int(np.random.exponential(scale=30)))   # Email less wrap-up
    else:  # Self-Service
        return 0  # No wrap-up for self-service

def get_agent_for_channel(channel):
    """
    Assign an appropriate agent based on channel.
    Some agents are specialized in certain channels.
    Returns None for self-service if no agent involved.
    """
    if channel == 'Self-Service':
        # 85% of self-service has no agent involvement
        if random.random() < 0.85:
            return None
    
    # Channel specialization (some agents handle specific channels more)
    voice_specialists = AGENTS[:20]  # First 20 agents specialize in voice
    chat_specialists = AGENTS[15:35]  # Agents 15-35 handle chat
    email_specialists = AGENTS[25:]  # Later agents handle email
    
    if channel == 'Voice':
        # 80% chance to use voice specialist, 20% any agent
        if random.random() < 0.8:
            return random.choice(voice_specialists)
    elif channel == 'Chat':
        # 80% chance to use chat specialist
        if random.random() < 0.8:
            return random.choice(chat_specialists)
    elif channel == 'Email':
        # 80% chance to use email specialist
        if random.random() < 0.8:
            return random.choice(email_specialists)
    
    # Default case - any available agent
    return random.choice(AGENTS)

def get_queue_for_channel_and_intent(channel, intent):
    """Assign an appropriate queue based on channel and intent."""
    # Simplified queue assignment
    # In reality, this would use complex routing rules
    
    # General mapping of queues to purposes
    general_queues = QUEUES[:3]        # General purpose
    tech_queues = QUEUES[3:5]          # Technical
    billing_queues = QUEUES[5:7]       # Billing/financial
    account_queues = QUEUES[7:9]       # Account management
    escalation_queue = [QUEUES[9]]     # Escalations
    
    # Technical intents
    if intent in ['Technical_Support', 'Password_Reset']:
        return random.choice(tech_queues)
    
    # Billing related
    elif intent in ['Billing_Question']:
        return random.choice(billing_queues)
    
    # Account related
    elif intent in ['Account_Update', 'Order_Status']:
        return random.choice(account_queues)
    
    # Complaints often go to escalation
    elif intent in ['Complaint'] and random.random() < 0.4:
        return random.choice(escalation_queue)
    
    # Default - use general queue
    return random.choice(general_queues)

def generate_sentiment_score():
    """
    Generate a sentiment score between -1.0 and 1.0.
    Score distribution is slightly positive (customer service focus).
    """
    # Slightly skewed toward positive sentiment
    return min(1.0, max(-1.0, np.random.normal(0.1, 0.5)))

def generate_csat(resolution_status, sentiment_score, handle_time, wait_time, channel):
    """
    Generate a realistic CSAT score (1-5) based on various factors.
    Many factors influence customer satisfaction.
    """
    # Base CSAT is influenced by resolution
    if resolution_status == 'Resolved':
        base_csat = np.random.normal(4.5, 0.5)
    elif resolution_status == 'Escalated':
        base_csat = np.random.normal(3.0, 0.7)
    else:  # Follow-Up
        base_csat = np.random.normal(3.5, 0.6)
    
    # Sentiment correlation
    sentiment_factor = 0.5 * (sentiment_score + 1)  # Convert -1,1 to 0,1
    
    # Wait time impact (longer wait = lower CSAT)
    wait_factor = max(0, 1 - (wait_time / 300) * 0.5)  # Reduce by up to 0.5 for long waits
    
    # Handle time has modest impact (too short or too long can be negative)
    if handle_time < 60:  # Too short
        handle_factor = 0.9  # Slight negative
    elif handle_time > 900:  # Too long
        handle_factor = 0.8  # More negative
    else:
        handle_factor = 1.0  # Neutral impact
    
    # Channel expectations differ
    channel_adjustments = {
        'Voice': 0.0,    # Neutral
        'Chat': 0.1,     # Slightly higher expectations
        'Email': -0.2,   # Lower expectations
        'Self-Service': -0.3  # Much lower expectations
    }
    
    # Calculate final CSAT with all factors
    final_csat = base_csat * (0.7 + 0.3 * sentiment_factor) * wait_factor * handle_factor
    final_csat += channel_adjustments[channel]
    
    # Ensure within bounds and round to nearest 0.5
    final_csat = min(5.0, max(1.0, final_csat))
    return round(final_csat * 2) / 2  # Round to nearest 0.5

def generate_nps(csat):
    """
    Generate an NPS score (-10 to 10) based on CSAT.
    NPS is correlated with but distinct from CSAT.
    """
    # Map CSAT to NPS range
    if csat >= 4.5:  # Promoters
        base_nps = random.randint(8, 10)
    elif csat >= 3.5:  # Passives
        base_nps = random.randint(0, 7)
    else:  # Detractors
        base_nps = random.randint(-10, -1)
    
    # Add some randomness
    adjustment = random.randint(-2, 2)
    nps = base_nps + adjustment
    
    # Ensure within bounds
    return min(10, max(-10, nps))

def generate_interaction_data(num_records=50000):
    """
    Generate a dataset of contact center interactions.
    
    Args:
        num_records: Number of interaction records to generate
        
    Returns:
        pandas.DataFrame: DataFrame containing the generated data
    """
    print(f"Generating {num_records} interaction records...")
    
    # Lists to hold generated data
    data = []
    
    # Generate the specified number of records
    for i in range(num_records):
        # Show progress
        if (i+1) % 5000 == 0:
            print(f"Generated {i+1} records...")
        
        # Generate base interaction data
        channel = np.random.choice(CHANNELS, p=CHANNEL_WEIGHTS)
        timestamp = generate_timestamp(START_DATE, END_DATE)
        intent = random.choice(INTENT_CATEGORIES)
        
        # Generate dependent fields
        wait_time = generate_wait_time(channel)
        handle_time = generate_handle_time(channel, intent)
        hold_time = generate_hold_time(channel, handle_time)
        wrap_up_time = generate_wrap_up_time(channel)
        agent_id = get_agent_for_channel(channel)
        queue_id = get_queue_for_channel_and_intent(channel, intent)
        
        # Determine if abandoned (more likely with longer wait times)
        abandoned = False
        if wait_time > 0:
            abandon_probability = min(0.9, wait_time / 500)  # Up to 90% for very long waits
            abandoned = random.random() < abandon_probability
        
        # If abandoned, adjust fields accordingly
        if abandoned:
            handle_time = 0
            hold_time = 0
            wrap_up_time = 0
            resolution_status = 'Abandoned'
            fcr_achieved = False
            sentiment_score = min(-0.3, generate_sentiment_score() - 0.5)  # Negative sentiment for abandons
            csat_score = None  # No CSAT for abandoned contacts
            nps_score = None   # No NPS for abandoned contacts
        else:
            # Generate outcome fields for completed interactions
            resolution_status = np.random.choice(RESOLUTION_STATUSES, p=RESOLUTION_WEIGHTS)
            sentiment_score = generate_sentiment_score()
            
            # FCR is correlated with resolution status
            if resolution_status == 'Resolved':
                fcr_achieved = random.random() < 0.85  # 85% FCR for resolved
            elif resolution_status == 'Escalated':
                fcr_achieved = random.random() < 0.30  # 30% FCR for escalated
            else:  # Follow-Up
                fcr_achieved = False  # By definition, follow-up means no FCR
            
            # CSAT and NPS are only for completed interactions
            csat_score = generate_csat(resolution_status, sentiment_score, handle_time, wait_time, channel)
            nps_score = generate_nps(csat_score)
        
        # AI assistance is more common in newer channels
        ai_probabilities = {
            'Voice': 0.4,     # 40% of voice uses AI assistance
            'Chat': 0.8,      # 80% of chat uses AI
            'Email': 0.7,     # 70% of email uses AI
            'Self-Service': 1.0  # All self-service uses AI
        }
        ai_assisted = random.random() < ai_probabilities[channel]
        
        # Transfer count - influenced by complexity and channel
        if channel == 'Voice' and not abandoned:
            # Voice has more transfers
            transfer_count = np.random.choice([0, 1, 2, 3], p=[0.7, 0.2, 0.08, 0.02])
        elif channel == 'Chat' and not abandoned:
            # Chat has some transfers
            transfer_count = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03])
        else:
            # Other channels have few transfers
            transfer_count = np.random.choice([0, 1], p=[0.95, 0.05])
        
        # Create the record
        record = {
            'interaction_id': f"INT-{i+10000}",
            'timestamp': timestamp.strftime('%Y-%m-%dT%H:%M:%S'),
            'channel': channel,
            'customer_id': generate_customer_id(),
            'agent_id': agent_id,
            'queue_id': queue_id,
            'wait_time_seconds': wait_time,
            'handle_time_seconds': handle_time,
            'hold_time_seconds': hold_time,
            'wrap_up_time_seconds': wrap_up_time,
            'ai_assisted': ai_assisted,
            'transfer_count': transfer_count,
            'abandoned': abandoned,
            'sentiment_score': round(sentiment_score, 2) if sentiment_score is not None else None,
            'intent_category': intent,
            'resolution_status': resolution_status,
            'csat_score': csat_score,
            'nps_score': nps_score,
            'fcr_achieved': fcr_achieved if not abandoned else None
        }
        
        data.append(record)
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Add time trend effects
    df = add_time_trends(df)
    
    return df

def add_time_trends(df):
    """
    Add time-based trends to the data.
    This simulates improvement over time due to process changes.
    """
    # Convert timestamp to datetime for processing
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Get days since start for each record
    days_since_start = (df['timestamp'] - pd.to_datetime(START_DATE)).dt.days
    
    # Calculate improvement factor (0.0 to 1.0) - more recent = more improvement
    max_days = (END_DATE - START_DATE).days
    improvement_factor = days_since_start / max_days
    
    # Gradually improve handle time (5-10% reduction over the period)
    handle_reduction = 0.05 + (0.05 * improvement_factor)  # 5-10% reduction
    # Convert to float first to avoid dtype warnings
    df['handle_time_seconds'] = df['handle_time_seconds'].astype(float)
    df.loc[~df['abandoned'], 'handle_time_seconds'] = df.loc[~df['abandoned'], 'handle_time_seconds'] * (1 - handle_reduction * improvement_factor)
    # Convert back to int after calculations
    df['handle_time_seconds'] = df['handle_time_seconds'].astype(int)
    
    # Gradually improve FCR (up to 10% improvement)
    # Only apply to non-abandoned, non-follow-up interactions where FCR is false
    # Handle None values safely
    df['fcr_achieved_bool'] = df['fcr_achieved'].fillna(False)
    mask = (~df['abandoned']) & (df['resolution_status'] != 'Follow-Up') & (~df['fcr_achieved_bool'])
    
    # Calculate probability of flipping FCR from false to true based on time
    fcr_improvement_chance = 0.1 * improvement_factor  # Up to 10% of falses become true
    
    # Get random mask for which rows to flip
    to_flip = mask & (np.random.random(size=len(df)) < fcr_improvement_chance)
    
    # Flip selected rows
    df.loc[to_flip, 'fcr_achieved'] = True
    
    # Also adjust resolution status for some of the flipped rows
    status_to_flip = to_flip & (df['resolution_status'] == 'Escalated') & (np.random.random(size=len(df)) < 0.5)
    df.loc[status_to_flip, 'resolution_status'] = 'Resolved'
    
    # Gradually improve AI assistance (more usage over time)
    # Calculate additional probability based on time
    ai_increase = 0.2 * improvement_factor  # Up to 20% more AI usage
    
    # Only apply to rows where AI isn't already used
    ai_mask = ~df['ai_assisted']
    
    # Determine which rows to flip
    ai_to_flip = ai_mask & (np.random.random(size=len(df)) < ai_increase)
    
    # Flip selected rows
    df.loc[ai_to_flip, 'ai_assisted'] = True
    
    # Reset timestamp to string for export
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S')
    
    return df

def save_data(df, filename="interactions.csv"):
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
    """Main function to generate and save data."""
    # Generate the data
    df = generate_interaction_data(50000)  # ~550 per day for 90 days
    
    # Save the data
    save_data(df)
    
    print("Interaction data generation complete.")

if __name__ == "__main__":
    main()
