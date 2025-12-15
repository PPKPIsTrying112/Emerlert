# Emerlert
Stay safe with instant emergency alerts. Trigger a quick alert to automatically call and text your emergency contacts with your exact GPS location. Your safety network, always one tap away.

# Overview
Users can trigger an emergency alert through a quick gesture (shake, volume buttons, or panic button). The app automatically:

Generates a voice message with current GPS location using text-to-speech
Initiates phone calls to emergency contacts with the automated voice message
Sends SMS messages with GPS coordinates to all emergency contacts simultaneously

# Tech Stack
## Frontend

React Native - Cross-platform mobile development (iOS + Android)
TypeScript - Type-safe development

## Backend

Node.js/Express OR Supabase - Backend API and services
PostgreSQL - Database for users, contacts, settings, and alert logs

## Third-Party Services

Twilio - Voice calls and SMS delivery
AWS Polly OR Google Text-to-Speech - Dynamic voice message generation
React Native Geolocation - GPS location tracking

# Key Features
## Alert Triggers

Shake gesture detection
Volume button combination (3x press)
Power button combination (3x press)
In-app panic button

## Alert Functionality

Automated voice calls with location readout
Simultaneous SMS with GPS coordinates
Customizable emergency contacts
User-defined alert settings

# Architecture 

< soon to come >

# Database Schema 
Users

id, email, phone, created_at

Emergency Contacts

id, user_id, name, phone, relationship

Alert Settings

id, user_id, message_template, trigger_type

Alert Logs

id, user_id, triggered_at, location, status

# Getting Started

