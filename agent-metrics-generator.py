#!/usr/bin/env python3
"""
Agent Metrics Generator

This script generates agent performance metrics for a contact center
workforce of 40-50 agents over a 3-month period, including metrics like adherence,
occupancy, quality scores, and CSAT ratings.

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
NUM_AGENTS = 45  # Number of agents
NUM_TEAMS = 5    # Number of teams
START_DATE = datetime(2024, 1, 1)  # Start date
END_DATE = datetime(2024, 3, 31)    # End date (3 months of data)

# Agent and team data
AGENTS = [f"A{str(i).zfill(3)}" for i in range(1, NUM_AGENTS + 1)]
TEAMS = [f"T{str(i).zfill(3)}" for i in range(1, NUM_TEAMS + 1)]

# Agent skill levels (will influence performance metrics)
AGENT_SKILLS = {}
for agent in AGENTS:
    # Assign a base skill level to each agent (0.6-1.0)
    AGENT_SKILLS[agent] = 0.6 + (random.random() * 0.4)

# Team assignments for agents
AGENT_TEAMS = {}
for i, agent in enumerate(AGENTS):
    # Distribute agents across teams
    team_idx = i % NUM_TEAMS
    AGENT_TEAMS[agent] = TEAMS[team_idx]

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

def get_agent_schedule(agent_id, date):
    """
    Determine an agent's scheduled work time for a given date.
    Takes into account skill level and randomness for realistic schedules.
    """
    # Get day of week (0 = Monday, 6 = Sunday)
    day_of_week = date.weekday()
    
    # Weekends have different patterns
    is_weekend = day_of_week >= 5
    
    # Base scheduled time (in minutes)
    if is_weekend:
        # Weekend shifts are typically shorter and not all agents work weekends
        if random.random() < 0.6:  # 60% of agents don't work weekends
            return 0
        base_time = 360  # 6 hours for weekend shifts
    else:
        base_time = 480  # 8 hours for weekday shifts
    
    # Random variation in schedule length (±30 minutes)
    variation = random.randint(-30, 30)
    
    # Add some agents with part-time schedules
    if agent_id in AGENTS[-5:] and random.random() < 0.4:  # Last 5 agents have 40% chance of part-time
        base_time = base_time * 0.5  # Half-time
    
    # Calculate final scheduled time
    scheduled_time = max(0, base_time + variation)
    
    # Some agents occasionally have days off during the week
    if not is_weekend and random.random() < 0.05:  # 5% chance of weekday off
        scheduled_time = 0
    
    return int(scheduled_time)

def generate_adherence(agent_skill, scheduled_time):
    """
    Generate a realistic adherence rate for an agent.
    Takes into account the agent's skill level and scheduled time.
    """
    if scheduled_time == 0:
        return None  # No adherence for off days
    
    # Base adherence - skilled agents have better adherence
    base_adherence = 85 + (agent_skill * 15)  # 85-100% base range
    
    # Random variation (±5%)
    variation = random.uniform(-5, 5)
    
    # Shorter shifts typically have better adherence
    if scheduled_time < 240:  # Less than 4 hours
        short_shift_bonus = 2
    else:
        short_shift_bonus = 0
    
    # Calculate final adherence
    adherence = base_adherence + variation + short_shift_bonus
    
    # Enforce bounds
    return round(min(100, max(75, adherence)), 1)

def generate_occupancy(agent_skill, date):
    """
    Generate an occupancy rate for an agent.
    Occupancy varies by day of week and agent skill.
    """
    # Base occupancy - skilled agents handle more contacts
    base_occupancy = 70 + (agent_skill * 20)  # 70-90% base range
    
    # Day of week effect (busier on certain days)
    day_of_week = date.weekday()
    
    # Monday and Tuesday typically busier
    if day_of_week == 0:  # Monday
        day_factor = 5  # +5%
    elif day_of_week == 1:  # Tuesday
        day_factor = 3  # +3%
    elif day_of_week >= 5:  # Weekend
        day_factor = -10  # -10%
    else:
        day_factor = 0  # No change
    
    # Random variation (±8%)
    variation = random.uniform(-8, 8)
    
    # Calculate final occupancy
    occupancy = base_occupancy + day_factor + variation
    
    # Enforce bounds
    return round(min(98, max(55, occupancy)), 1)

def generate_aht(agent_skill):
    """
    Generate average handle time for an agent.
    More skilled agents generally have lower AHT.
    """
    # Base AHT (in seconds)
    # Inverse relationship with skill - higher skill = lower AHT
    base_aht = 600 - (agent_skill * 200)  # 400-600 second range
    
    # Random variation (±20%)
    variation_factor = random.uniform(0.8, 1.2)
    
    # Calculate final AHT
    aht = base_aht * variation_factor
    
    # Enforce minimum AHT
    return round(max(180, aht), 1)

def generate_acw(agent_skill):
    """
    Generate average after-call work time for an agent.
    More skilled agents generally have lower ACW.
    """
    # Base ACW (in seconds)
    # Inverse relationship with skill - higher skill = lower ACW
    base_acw = 180 - (agent_skill * 100)  # 80-180 second range
    
    # Random variation (±25%)
    variation_factor = random.uniform(0.75, 1.25)
    
    # Calculate final ACW
    acw = base_acw * variation_factor
    
    # Enforce minimum ACW
    return round(max(30, acw), 1)

def generate_quality_score(agent_skill, date):
    """
    Generate a quality evaluation score for an agent.
    Quality scores tend to improve over time with coaching.
    """
    # Base quality score - skilled agents have better quality
    base_quality = 75 + (agent_skill * 20)  # 75-95 base range
    
    # Time improvement factor - quality improves over time
    days_since_start = (date - START_DATE).days
    max_days = (END_DATE - START_DATE).days
    time_factor = (days_since_start / max_days) * 5  # Up to +5 points improvement
    
    # Random variation (±7 points)
    variation = random.uniform(-7, 7)
    
    # Calculate final quality score
    quality = base_quality + time_factor + variation
    
    # Enforce bounds
    return round(min(100, max(60, quality)), 1)

def generate_csat_average(agent_skill):
    """
    Generate an average CSAT score for an agent.
    CSAT is correlated with agent skill but has high variability.
    """
    # Base CSAT - skilled agents get better ratings
    base_csat = 3.5 + (agent_skill * 1.3)  # 3.5-4.8 base range
    
    # Random variation (±0.6 points)
    variation = random.uniform(-0.6, 0.6)
    
    # Calculate final CSAT
    csat = base_csat + variation
    
    # Enforce bounds and round to 1 decimal
    return round(min(5.0, max(1.0, csat)), 1)

def generate_fcr_rate(agent_skill, quality_score):
    """
    Generate a first contact resolution rate for an agent.
    FCR is correlated with both skill and quality score.
    """
    # Base FCR rate - skilled agents resolve more on first contact
    base_fcr = 0.6 + (agent_skill * 0.25)  # 60-85% base range
    
    # Quality factor - better quality typically means better FCR
    quality_factor = (quality_score - 80) / 100  # -0.2 to +0.2 based on quality
    
    # Random variation (±0.1)
    variation = random.uniform(-0.1, 0.1)
    
    # Calculate final FCR rate
    fcr = base_fcr + quality_factor + variation
    
    # Enforce bounds
    return round(min(1.0, max(0.5, fcr)), 2)

def generate_agent_metrics(start_date, end_date):
    """
    Generate a dataset of daily agent performance metrics.
    
    Args:
        start_date: Start date for the data generation
        end_date: End date for the data generation
        
    Returns:
        pandas.DataFrame: DataFrame containing the generated agent metrics
    """
    print(f"Generating agent metrics from {start_date} to {end_date}...")
    
    # Generate all dates in the range
    dates = generate_date_range(start_date, end_date)
    
    # List to hold all records
    all_records = []
    
    # Generate records for each agent for each date
    record_count = 0
    for date in dates:
        for agent_id in AGENTS:
            # Get skill level for this agent
            skill = AGENT_SKILLS[agent_id]
            
            # Get scheduled time for this agent on this date
            scheduled_time = get_agent_schedule(agent_id, date)
            
            # Skip if agent isn't scheduled
            if scheduled_time == 0:
                continue
            
            # Generate metrics based on agent skill and date
            adherence = generate_adherence(skill, scheduled_time)
            occupancy = generate_occupancy(skill, date)
            aht = generate_aht(skill)
            acw = generate_acw(skill)
            quality_score = generate_quality_score(skill, date)
            csat_average = generate_csat_average(skill)
            fcr_rate = generate_fcr_rate(skill, quality_score)
            
            # Calculate derived metrics
            logged_time = int(scheduled_time * (adherence / 100))
            productive_time = int(logged_time * (occupancy / 100))
            available_time = logged_time - productive_time
            
            # Estimate number of contacts based on AHT and productive time
            avg_contact_time = aht + acw  # Total time per contact in seconds
            # Convert productive minutes to seconds and divide by avg_contact_time
            contacts_handled = int((productive_time * 60) / avg_contact_time)
            
            # Create the record
            record = {
                'metric_id': f"AM-{record_count + 10000}",
                'date': date.strftime('%Y-%m-%d'),
                'agent_id': agent_id,
                'team_id': AGENT_TEAMS[agent_id],
                'scheduled_time_minutes': scheduled_time,
                'logged_time_minutes': logged_time,
                'productive_time_minutes': productive_time,
                'available_time_minutes': available_time,
                'contacts_handled': contacts_handled,
                'adherence_rate': adherence,
                'occupancy_rate': occupancy,
                'aht': aht,
                'acw': acw,
                'quality_score': quality_score,
                'csat_average': csat_average,
                'fcr_rate': fcr_rate
            }
            
            all_records.append(record)
            record_count += 1
            
        # Show progress periodically
        if date.day == 1 or date.day == 15:
            print(f"Generated metrics through {date.strftime('%Y-%m-%d')}...")
    
    # Convert to DataFrame
    df = pd.DataFrame(all_records)
    
    # Add time trends to improve realism
    df = add_time_trends(df)
    
    print(f"Generated {len(df)} agent metric records.")
    return df

def add_time_trends(df):
    """
    Add time-based trends to the data.
    This simulates improvement over time due to coaching and process changes.
    """
    # Convert date to datetime for processing
    df['date'] = pd.to_datetime(df['date'])
    
    # Get days since start for each record
    days_since_start = (df['date'] - pd.to_datetime(START_DATE)).dt.days
    max_days = (END_DATE - START_DATE).days
    improvement_factor = days_since_start / max_days
    
    # Gradually improve adherence (up to 2% improvement)
    adherence_improvement = 2 * improvement_factor
    df['adherence_rate'] = df['adherence_rate'] + (adherence_improvement * (100 - df['adherence_rate']) / 100)
    
    # Gradually improve AHT (5-8% reduction)
    aht_reduction = (0.05 + (0.03 * improvement_factor)) * improvement_factor
    df['aht'] = df['aht'] * (1 - aht_reduction)
    
    # Gradually improve CSAT (up to 0.3 point improvement, more for lower scores)
    csat_improvement = 0.3 * improvement_factor * (5 - df['csat_average']) / 4
    df['csat_average'] = df['csat_average'] + csat_improvement
    
    # Enforce bounds on improved metrics
    df['adherence_rate'] = df['adherence_rate'].apply(lambda x: min(100, max(75, x)))
    df['csat_average'] = df['csat_average'].apply(lambda x: min(5.0, max(1.0, x)))
    
    # Format date back to string
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')
    
    # Round numeric columns
    df['adherence_rate'] = df['adherence_rate'].round(1)
    df['occupancy_rate'] = df['occupancy_rate'].round(1)
    df['aht'] = df['aht'].round(1)
    df['acw'] = df['acw'].round(1)
    df['quality_score'] = df['quality_score'].round(1)
    df['csat_average'] = df['csat_average'].round(1)
    df['fcr_rate'] = df['fcr_rate'].round(2)
    
    return df

def save_data(df, filename="agent_metrics.csv"):
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
    """Main function to generate and save agent metrics data."""
    # Generate the data
    df = generate_agent_metrics(START_DATE, END_DATE)
    
    # Save the data
    save_data(df)
    
    print("Agent metrics generation complete.")

if __name__ == "__main__":
    main()