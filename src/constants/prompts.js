const TIME_PROMPTS = {
  ultra_direct_minimal: [
    "What time?",
    "Time?",
    "When?",
    "Scheduled time?",
    "Time please.",
  ],
  direct_clear: [
    "What time should this be scheduled for?",
    "What time do you want this done?",
    "What time should I set it for?",
    "At what time should this happen?",
    "What time is this for?",
  ],
  friendly_conversational: [
    "What time works for you?",
    "When would you like this scheduled?",
    "When do you want this to happen?",
    "What time are you thinking?",
    "What time suits you best?",
  ],
  polite_professional: [
    "Could you tell me what time you’d like this scheduled?",
    "Please let me know the time for this task.",
    "May I know what time to set this for?",
    "Would you like to specify a time?",
    "Kindly provide the preferred time.",
  ],
  clarifying_error_recovery: [
    "I didn’t catch a time — when should this be scheduled?",
    "No time was mentioned. What time should I use?",
    "A time wasn’t included. When should this happen?",
    "I need a time to continue. What should it be?",
    "The task needs a time. When would you like it?",
  ],
  context_aware_intelligent: [
    "When should this occur today?",
    "Should this be scheduled for a specific time?",
    "Is there a particular time you want this done?",
    "When would be the best time for this?",
    "What time should I lock this in for?",
  ],
  smart_ai_proactive: [
    "To finish setting this up, I just need the time.",
    "Before I schedule this, what time should I use?",
    "I can schedule this as soon as you tell me the time.",
    "Let me know the time and I’ll take care of the rest.",
    "What time should I finalize this for?",
  ],
  casual_relaxed: [
    "When should I put this?",
    "What time should I go with?",
    "When do you want it?",
    "What time do you want?",
    "When’s good?",
  ],
  formal_enterprise: [
    "Please specify the time for this task.",
    "Kindly indicate the desired execution time.",
    "At what time should this task be executed?",
    "Please confirm the scheduled time.",
    "Time specification is required to proceed.",
  ],
  ux_guided_prompting: [
    "Choose a time for this task.",
    "Select a time to continue.",
    "Set a time for this task.",
    "Pick a time that works for you.",
    "Add a time to complete scheduling.",
  ],
  confirmation_seeking: [
    "Should I schedule this for a specific time?",
    "Do you have a preferred time?",
    "Is there a time you’d like me to use?",
    "Would now or later work better?",
    "Do you want to set a time?",
  ],
  default_hinting_optional: [
    "No time was provided — should I use the default time?",
    "Want me to schedule this for now?",
    "Should I set this for the next available time?",
    "Use the usual time?",
    "Schedule this for today, or another time?",
  ],
  voice_assistant_optimized: [
    "What time should I schedule this?",
    "When should this happen?",
    "Tell me the time for this task.",
    "What time would you like?",
    "When do you want this done?",
  ],
  developer_system_debug: [
    "Missing required field: time. Please provide a time.",
    "Time parameter not detected. Specify time.",
    "Cannot proceed without time input.",
    "Time value required to schedule task.",
    "Awaiting time input.",
  ],
};

export const getRandomTimePrompt = () => {
  const categories = Object.keys(TIME_PROMPTS);
  const randomCategory =
    categories[Math.floor(Math.random() * categories.length)];
  const prompts = TIME_PROMPTS[randomCategory];
  return prompts[Math.floor(Math.random() * prompts.length)];
};
