Old Way (Express Server): 
- Pay for a server to run 24/7, even when no one is in danger. (Expensive, Wasteful).

New Way (Serverless/Next.js): 
- The server doesn't exist until a request comes in.Request hits $\to$ Mini-Server spins up in 100ms $\to$ Runs code $\to$ Dies.This is how you justify the "<200ms cold start" metric.