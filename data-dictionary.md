# Contact Center Data Dictionary

This data dictionary provides detailed definitions for all data fields used in the Contact Center Analytics repository. It serves as a reference for understanding the meaning, format, and business context of each data element.

## Interaction Data Fields

| Field Name | Description | Format | Business Context | Calculation (if applicable) |
|------------|-------------|--------|------------------|----------------------------|
| interaction_id | Unique identifier for each customer interaction | String (INT-XXXXX) | Used for tracking individual contacts across systems | Sequentially generated |
| timestamp | Date and time when the interaction started | Datetime (YYYY-MM-DDTHH:MM:SS) | Used for time-based analysis and service level calculations | System-recorded |
| channel | Communication method used by the customer | String (Voice, Chat, Email, Self-Service) | Critical for channel strategy and staffing decisions | Determined by originating system |
| customer_id | Unique identifier for the customer | String (CXXXX) | Enables customer journey mapping and history analysis | CRM-assigned |
| agent_id | Identifier for the handling agent | String (AXXX) | Links to agent performance metrics | WFM-assigned |
| queue_id | Identifier for the queue the interaction was routed through | String (QXXX) | Used for measuring queue performance and routing efficiency | Contact center platform-assigned |
| wait_time_seconds | Time between customer initiation and agent connection | Integer (seconds) | Key service level and customer experience metric | timestamp_agent_connected - timestamp_initiated |
| handle_time_seconds | Total time spent handling the interaction | Integer (seconds) | Critical for workforce planning and efficiency | timestamp_completed - timestamp_agent_connected |
| hold_time_seconds | Time customer spent on hold during interaction | Integer (seconds) | Indicator of process inefficiency or complexity | Sum of all hold durations |
| wrap_up_time_seconds | Time agent spent on after-contact work | Integer (seconds) | Impacts agent utilization and staffing requirements | timestamp_available - timestamp_completed |
| ai_assisted | Whether AI tools were used during interaction | Boolean | Measures technology adoption and impact | Based on system usage flags |
| transfer_count | Number of times interaction was transferred | Integer | Indicates process complexity or training needs | Count of transfer events |
| abandoned | Whether customer left before completion | Boolean | Negative customer experience indicator | Based on disconnect without resolution |
| sentiment_score | Calculated customer sentiment | Float (-1.0 to 1.0) | Measures emotional tone of interaction | NLP algorithm on conversation text |
| intent_category | Classified reason for contact | String | Used for contact driver analysis | NLP classification of conversation |
| resolution_status | Final status of the interaction | String (Resolved, Escalated, Follow-Up) | Measures first contact resolution capability | Agent-selected or system-determined |
| csat_score | Customer satisfaction rating | Float (1.0-5.0) | Key customer experience metric | Customer survey response |
| nps_score | Net Promoter Score rating | Integer (-10 to 10) | Loyalty and advocacy indicator | Customer survey response |
| fcr_achieved | First Contact Resolution achieved | Boolean | Efficiency and quality indicator | No follow-up within 48 hours |

## Agent Metrics Fields

| Field Name | Description | Format | Business Context | Calculation (if applicable) |
|------------|-------------|--------|------------------|----------------------------|
| metric_id | Unique identifier for the metric record | String (AM-XXXXX) | Used for data integrity and tracking | Sequentially generated |
| date | Date of the agent metrics | Date (YYYY-MM-DD) | Used for trend analysis and performance tracking | Calendar date |
| agent_id | Identifier for the agent | String (AXXX) | Links to agent profile and interactions | WFM-assigned |
| team_id | Identifier for the agent's team | String (TXXX) | Enables team-level analysis | Org structure-assigned |
| scheduled_time_minutes | Minutes scheduled for work | Integer | Base for adherence calculations | From WFM schedule |
| logged_time_minutes | Minutes logged into system | Integer | Measures system availability | system_logout_time - system_login_time |
| productive_time_minutes | Minutes in productive states | Integer | Measures billable or valuable time | Sum of handling and work states |
| available_time_minutes | Minutes in available state | Integer | Measures capacity for new contacts | Sum of available state time |
| contacts_handled | Total interactions handled | Integer | Productivity measure | Count of completed interactions |
| adherence_rate | Schedule adherence percentage | Float (0-100) | Measures schedule compliance | (time_in_correct_state / scheduled_time) * 100 |
| occupancy_rate | Percentage of time handling contacts | Float (0-100) | Utilization efficiency measure | (handling_time / (handling_time + available_time)) * 100 |
| aht | Average handle time in seconds | Float | Efficiency and forecast metric | total_handling_time / contacts_handled |
| acw | Average after-call work time | Float | Process efficiency metric | total_wrap_up_time / contacts_handled |
| quality_score | Quality evaluation score | Float (0-100) | Compliance and effectiveness measure | Average of evaluation form scores |
| csat_average | Average CSAT score for the day | Float (1.0-5.0) | Customer satisfaction indicator | Average of CSAT scores |
| fcr_rate | First contact resolution rate | Float (0-1.0) | Resolution efficiency | contacts_resolved / contacts_handled |

## Queue Metrics Fields

| Field Name | Description | Format | Business Context | Calculation (if applicable) |
|------------|-------------|--------|------------------|----------------------------|
| metric_id | Unique identifier for the metric record | String (QM-XXXXX) | Used for data integrity and tracking | Sequentially generated |
| timestamp | Hour timestamp for the metrics | Datetime (YYYY-MM-DDTHH:00:00) | Used for time-based analysis | Hourly interval |
| queue_id | Identifier for the queue | String (QXXX) | Links to queue configuration | Platform-assigned |
| channel | Channel the queue serves | String | Used for channel-specific analysis | Platform-assigned |
| contacts_offered | Number of contacts offered to queue | Integer | Total inbound volume | Count of routing attempts |
| contacts_handled | Number of contacts handled from queue | Integer | Processing capacity measure | Count of handled interactions |
| contacts_abandoned | Number of contacts abandoned | Integer | Service failure measure | Count of abandons |
| service_level | Percentage answered within target | Float (0-100) | Key performance metric | (answered_within_threshold / contacts_offered) * 100 |
| average_wait_time | Average wait time in seconds | Float | Customer experience metric | sum_of_wait_times / contacts_handled |
| longest_wait_time | Longest wait time in seconds | Integer | Extreme experience indicator | Maximum wait time in period |
| average_handle_time | Average handle time in seconds | Float | Efficiency metric | sum_of_handle_times / contacts_handled |
| occupancy | Agent occupancy percentage | Float (0-100) | Utilization measure | (handling_time / (handling_time + available_time)) * 100 |
| concurrency | Average concurrent chats | Float | Chat efficiency measure | sum_of_concurrent_chats / time_periods |

## Technology Metrics Fields

| Field Name | Description | Format | Business Context | Calculation (if applicable) |
|------------|-------------|--------|------------------|----------------------------|
| metric_id | Unique identifier for the metric record | String (TM-XXXXX) | Used for data integrity and tracking | Sequentially generated |
| date | Date of the metrics | Date (YYYY-MM-DD) | Used for trend analysis | Calendar date |
| technology_id | Identifier for the technology | String | Links to technology configuration | System-assigned |
| integration_type | Type of integration | String (API, Webhook, Custom Script) | Used for integration pattern analysis | Configuration-defined |
| successful_transactions | Number of successful operations | Integer | Success volume | Count of success status codes |
| failed_transactions | Number of failed operations | Integer | Failure volume | Count of error status codes |
| average_response_time_ms | Average response time in milliseconds | Float | Performance metric | sum_of_response_times / total_transactions |
| error_rate | Percentage of transactions with errors | Float (0-100) | Reliability measure | (failed_transactions / total_transactions) * 100 |
| containment_rate | Percentage of interactions contained by AI | Float (0-100) | AI effectiveness measure | (ai_resolved / ai_total) * 100 |
| deflection_rate | Percentage of contacts deflected | Float (0-100) | Self-service effectiveness | (deflected_contacts / potential_contacts) * 100 |
| cost_savings | Estimated cost savings in dollars | Float | Business impact measure | deflected_contacts * average_agent_cost_per_contact |

## AI Conversation Metrics Fields

| Field Name | Description | Format | Business Context | Calculation (if applicable) |
|------------|-------------|--------|------------------|----------------------------|
| conversation_id | Unique identifier for AI conversation | String (AI-XXXXX) | Used for conversation tracking | Sequentially generated |
| timestamp | Start time of the conversation | Datetime (YYYY-MM-DDTHH:MM:SS) | Used for time analysis | System-recorded |
| customer_id | Customer identifier | String (CXXXX) | Links to customer profile | CRM-assigned |
| duration_seconds | Total duration of conversation | Integer (seconds) | Efficiency metric | end_timestamp - start_timestamp |
| message_count | Total number of messages exchanged | Integer | Volume measure | customer_messages + ai_messages |
| customer_message_count | Number of customer messages | Integer | Customer engagement measure | Count of customer messages |
| ai_message_count | Number of AI responses | Integer | AI response measure | Count of AI messages |
| intent_detected | Primary intent detected | String | Used for intent analysis | Highest confidence intent |
| secondary_intents | Additional intents identified | String (comma separated) | Used for complex intent analysis | Other above-threshold intents |
| confidence_score | AI confidence in understanding | Float (0-1.0) | Understanding effectiveness | ML model confidence output |
| sentiment_start | Sentiment at conversation start | Float (-1.0 to 1.0) | Initial mood measure | NLP analysis of first messages |
| sentiment_end | Sentiment at conversation end | Float (-1.0 to 1.0) | Final mood measure | NLP analysis of final messages |
| escalated_to_agent | Whether escalated to human | Boolean | Containment failure indicator | Based on escalation event |
| escalation_reason | Reason for escalation | String | Used for improvement analysis | Agent or system categorization |
| successful_resolution | Whether AI resolved the issue | Boolean | Success measure | Based on resolution confirmation |
| entity_extracted_count | Number of entities extracted | Integer | Data capture effectiveness | Count of extracted entities |

## Key Metric Definitions

### Service Level
The percentage of interactions answered within a defined threshold time (typically 20-30 seconds for voice, 30-60 seconds for chat).

**Formula:** (Contacts Answered Within Threshold / Total Contacts) * 100

### Occupancy Rate
The percentage of time agents spend handling contacts versus waiting for contacts.

**Formula:** (Handling Time / (Handling Time + Available Time)) * 100

### Adherence Rate
The percentage of time agents follow their assigned schedule.

**Formula:** (Time in Correct State / Scheduled Time) * 100

### First Contact Resolution (FCR)
The percentage of customer issues resolved in a single contact without follow-up.

**Formula:** (Contacts Resolved on First Attempt / Total Contacts) * 100

### Cost Per Contact
The average cost to handle a customer interaction.

**Formula:** (Total Contact Center Costs / Total Contacts Handled)

### Net Promoter Score (NPS)
Customer loyalty measure based on likelihood to recommend (0-10 scale).

**Categories:**
- Promoters: 9-10
- Passives: 7-8
- Detractors: 0-6

**Formula:** (% Promoters - % Detractors)

### AI Containment Rate
The percentage of AI conversations that resolve customer issues without human intervention.

**Formula:** (AI Conversations Resolved / Total AI Conversations) * 100

## Data Value Ranges and Distributions

| Metric | Typical Range | Expected Distribution | Notes |
|--------|---------------|------------------------|-------|
| CSAT | 1.0-5.0 | Left-skewed (most scores 4-5) | Industry average ~4.2 |
| Handle Time | Voice: 180-600s<br>Chat: 300-900s<br>Email: 300-1200s | Log-normal | Varies significantly by intent |
| Wait Time | 0-300s | Right-skewed | Target <30s for voice |
| Adherence | 80-100% | Normal (mean ~92%) | Critical WFM metric |
| Occupancy | 65-95% | Slightly right-skewed | Target 85-88% for balance |
| Error Rate | 0-10% | Right-skewed | Target <2% for integrations |
| Sentiment Score | -1.0 to 1.0 | Bimodal or normal | Voice more extreme than text |
| Abandonment Rate | 0-20% | Right-skewed | Target <5% for voice |
| Cost Savings | $0-100 per contact | Normal | Depends on channel and complexity |