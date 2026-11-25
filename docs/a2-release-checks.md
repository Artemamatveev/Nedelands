# Bittertalen A2 release checks

Use a single identified app build and the matching website revision. Record the iOS version, device, build number, website revision and outcome for each check. Use test accounts and invented personal details. Run the checks before public launch.

## Physical iPhone and browser

| Flow | What to exercise | Expected result |
| --- | --- | --- |
| Start and sign in | Cold start on Wi-Fi and mobile data. Sign in with an account, then leave it and continue as a guest. Restart mid-session. | Launch UI appears while loading. Study progress and drafts stay in the correct scope. |
| Spreken practice and exam | Deny and re-enable microphone access. Stop early, retake, advance, background and terminate the app after a confirmed answer. Reopen, submit after expiry, and drop the network during grading. | The original deadline and completed transcripts return. A retry can use the same check receipt. The exam feedback clearly says it assesses the transcript. |
| Schrijven practice and exam | Answer incorrectly, rewrite the corrections, check the rewritten answer and return from a focused task. Drop the network during exam submission, restore connectivity and retry. | Drafts remain editable after temporary failures. Corrections match the marked mistakes. The final result records one attempt. |
| Luisteren practice and exam | Complete A2 with headphones and the speaker. Interrupt a fragment, navigate between its questions, and test audio recovery after network loss. | The whole fragment is audible at a consistent level and the exam enforces its two-play allowance. Log the fragment key and time for audible defects. |
| Lezen practice and exam | Open a long passage, scroll and return between its questions, then complete the exam. | The passage stays readable on the phone. The exam contains 25 questions and keeps each passage together with its questions. |
| KNM practice and exam | Open photos and listen to question and option narration on the device. Pay particular attention to knm\|91, knm\|341 and knm\|384. | Every photo displays. Text and audio match. The correct option does not stand out by length. |
| Stats and retry receipt | As a signed-in learner, drop the client connection after a grade reaches the server. Reopen the same draft and request the result again. | The same grade appears, the balance is debited once, and one result appears after restart. |

## Spreken calibration with an NT2 teacher

Collect 24 consented, de-identified answer clips across the four A2 task formats with six per format. Within each format choose two clear answers, two nearly sufficient answers and two weak or off-topic answers. Use actual learner responses for this calibration. Keep the recordings and transcripts outside the repository.

For each clip record the task key, the teacher's rubric scores, the app's transcript scores, the app's decision, and either the key transcription error or an indication that the transcript is faithful. Ask the teacher to score the recording first and then independently score the transcript on the criteria the app can assess. Review all mismatches at the practice threshold and cases where transcription changes the meaning. Record separate observations for pronunciation and fluency. This review has no results until the teacher scores the samples.
