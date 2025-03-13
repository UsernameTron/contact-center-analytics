# Contact Center Data Schema

This document defines the schema for all data sets used in the Contact Center Analytics repository. The schema is designed to model realistic contact center operations across multiple channels, agent performance metrics, and technology integration points.

## Core Data Tables

### 1. Interactions

The `interactions` table contains records of all customer touchpoints across different channels.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| interaction_id | string | Unique identifier for the interaction (format: INT-XXXXX) |
| timestamp | datetime | Date and time when the interaction occurred |
| channel | string | Communication channel (Voice, Chat, Email, Self-Service) |
| customer_id | string | Unique identifier for the customer |
| agent_id | string | Identifier for the handling agent (null for self-service) |
| queue_id | string | Identifier for the queue the interaction was routed through |
| wait_time_seconds | integer | Time customer waited before agent connection |
| handle_time_seconds | integer | Total handling time for the interaction |
| hold_time_seconds | integer | Time customer spent on hold during interaction |
| wrap_up_time_seconds | integer | After-call work time for the agent |
| ai_assisted | boolean | Whether AI tools were used during the interaction |
| transfer_count | integer | Number of transfers that occurred |
| abandoned | boolean | Whether the customer abandoned before completion |
| sentiment_score | float | Calculated sentiment score (-1.0 to 1.0) |
| intent_category | string | Classified customer intent |
| resolution_status | string | Final status (Resolved, Escalated, Follow-Up) |
| csat_score | float | Customer satisfaction score (1-5) |
| nps_score | integer | Net Promoter Score (-10 to 10) |
| fcr_achieved | boolean | Whether First Contact Resolution was achieved |

### 2. Agent Metrics

The `agent_metrics` table contains daily performance metrics for each agent.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| metric_id | string | Unique identifier for the metric record |
| date | date | Date of the metrics |
| agent_id | string | Identifier for the agent |
| team_id | string | Identifier for the agent's team |
| scheduled_time_minutes | integer | Minutes scheduled for the day |
| logged_time_minutes | integer | Minutes logged into the system |
| productive_time_minutes | integer | Minutes spent on productive activities |
| available_time_minutes | integer | Minutes in available state |
| contacts_handled | integer | Total number of interactions handled |
| adherence_rate | float | Schedule adherence as percentage |
| occupancy_rate | float | Percentage of time handling contacts |
| aht | float | Average handle time across all channels |
| acw | float | Average after-call work time |
| quality_score | float | Quality evaluation score (0-100) |
| csat_average | float | Average CSAT score for the day |
| fcr_rate | float | First contact resolution rate |

### 3. Queue Metrics

The `queue_metrics` table contains hourly performance metrics for each queue.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| metric_id | string | Unique identifier for the metric record |
| timestamp | datetime | Hour timestamp for the metrics |
| queue_id | string | Identifier for the queue |
| channel | string | Channel the queue serves |
| contacts_offered | integer | Number of contacts offered to queue |
| contacts_handled | integer | Number of contacts handled from queue |
| contacts_abandoned | integer | Number of contacts abandoned |
| service_level | float | Percentage of contacts answered within target |
| average_wait_time | float | Average wait time in seconds |
| longest_wait_time | integer | Longest wait time in seconds |
| average_handle_time | float | Average handle time in seconds |
| occupancy | float | Agent occupancy percentage |
| concurrency | float | Average concurrent chats (for chat channel) |

### 4. Technology Metrics

The `technology_metrics` table tracks the performance and impact of technology integrations.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| metric_id | string | Unique identifier for the metric record |
| date | date | Date of the metrics |
| technology_id | string | Identifier for the technology (AI, CRM, WFM) |
| integration_type | string | Type of integration (API, Webhook, Custom Script) |
| successful_transactions | integer | Number of successful operations |
| failed_transactions | integer | Number of failed operations |
| average_response_time_ms | float | Average response time in milliseconds |
| error_rate | float | Percentage of transactions that resulted in errors |
| containment_rate | float | Percentage of interactions contained (for AI) |
| deflection_rate | float | Percentage of contacts deflected from agents |
| cost_savings | float | Estimated cost savings in dollars |

### 5. AI Conversation Metrics

The `ai_conversations` table contains detailed metrics on AI chatbot interactions.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| conversation_id | string | Unique identifier for the AI conversation |
| timestamp | datetime | Start time of the conversation |
| customer_id | string | Customer identifier |
| duration_seconds | integer | Total duration of the conversation |
| message_count | integer | Total number of messages exchanged |
| customer_message_count | integer | Number of customer messages |
| ai_message_count | integer | Number of AI responses |
| intent_detected | string | Primary intent detected |
| secondary_intents | string | Additional intents identified (comma separated) |
| confidence_score | float | AI confidence in understanding (0-1.0) |
| sentiment_start | float | Sentiment at conversation start (-1.0 to 1.0) |
| sentiment_end | float | Sentiment at conversation end (-1.0 to 1.0) |
| escalated_to_agent | boolean | Whether escalated to human agent |
| escalation_reason | string | Reason for escalation (if applicable) |
| successful_resolution | boolean | Whether AI resolved the issue |
| entity_extracted_count | integer | Number of entities extracted from conversation |

## Relationships

The schema is designed with the following relationships:

1. **Interactions to Agent Metrics**: Many-to-one relationship through `agent_id`
2. **Interactions to Queue Metrics**: Many-to-one relationship through `queue_id` and `timestamp`
3. **Agent Metrics to Team**: Many-to-one relationship through `team_id`
4. **Technology Metrics to Interactions**: One-to-many relationship through usage patterns and timestamps
5. **AI Conversations to Interactions**: One-to-one relationship for escalated conversations

## Data Distribution Guidelines

To generate realistic synthetic data:

1. **Channel Distribution**:
   - Voice: 45-50% of total volume
   - Chat: 25-30% of total volume
   - Email: 15-20% of total volume
   - Self-Service: 10-15% of total volume

2. **Time Patterns**:
   - Peak hours: 9am-11am and 1pm-3pm
   - Low volume: Early morning (5am-7am) and evening (7pm-10pm)
   - Weekdays have 20-30% higher volume than weekends

3. **Agent Performance**:
   - Adherence: Normal distribution around 92% (sd=5%)
   - Handle times: Log-normal distribution
   - Quality scores: Left-skewed distribution (more high scores)

4. **Technology Impact**:
   - AI containment: Increasing trend over the 3-month period
   - API error rates: Random spikes with overall decreasing trend
   - Cost savings: Directly correlated with containment rates

## Sample Data Records

### Interaction Record Example
```json
{
  "interaction_id": "INT-28374",
  "timestamp": "2024-02-15T10:23:45",
  "channel": "Chat",
  "customer_id": "C9283",
  "agent_id": "A042",
  "queue_id": "Q008",
  "wait_time_seconds": 45,
  "handle_time_seconds": 328,
  "hold_time_seconds": 0,
  "wrap_up_time_seconds": 65,
  "ai_assisted": true,
  "transfer_count": 0,
  "abandoned": false,
  "sentiment_score": 0.42,
  "intent_category": "Account_Update",
  "resolution_status": "Resolved",
  "csat_score": 4.5,
  "nps_score": 9,
  "fcr_achieved": true
}
```

### Agent Metrics Record Example
```json
{
  "metric_id": "AM-92833",
  "date": "2024-02-15",
  "agent_id": "A042",
  "team_id": "T005",
  "scheduled_time_minutes": 480,
  "logged_time_minutes": 475,
  "productive_time_minutes": 445,
  "available_time_minutes": 120,
  "contacts_handled": 42,
  "adherence_rate": 94.8,
  "occupancy_rate": 89.2,
  "aht": 290.5,
  "acw": 62.3,
  "quality_score": 92.0,
  "csat_average": 4.3,
  "fcr_rate": 0.88
}
```
