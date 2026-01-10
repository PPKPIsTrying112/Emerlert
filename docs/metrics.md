The "Latency" Metric (React Native)
"Engineered an Optimistic UI interaction pattern in React Native, reducing perceived emergency trigger latency from 2.4s to <50ms for users in high-stress environments."
The Build Goal: Make the button turn green instantly, handling the API call in the background.

The "Reliability" Metric (System Design)
"Architected a Multi-Channel Failover System (SMS $\to$ Voice) using Twilio & Next.js, ensuring 99.9% alert delivery even during partial carrier outages."
The Build Goal: A simple try/catch block: If SMS fails, trigger a voice call.

The "Scalability" Metric (Backend)
"Developed an Event-Driven Microservice for alert ingestion using Next.js API Routes, capable of handling concurrent trigger payloads with <200ms cold start time."
The Build Goal: Keep the API route lightweight (Serverless function) rather than a heavy Express server.

The "Security" Metric (Auth/DB)
"Implemented Row-Level Security (RLS) in PostgreSQL (Supabase) to strictly isolate user location data, ensuring zero unauthorized access to sensitive geospatial history."
The Build Goal: Use Supabase policies so a hacker can't query "SELECT * FROM locations".