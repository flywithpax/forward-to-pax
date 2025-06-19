function filterAndForwardOriginalEmails() {
  // Define where to send emails
  const forwardingAddress = "hello@flywithpax.com";

  // Define the label name
  const LABEL_NAME = "sent-to-pax";

  // Check if the label exists, create it if it doesn't
  let label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    try {
      label = GmailApp.createLabel(LABEL_NAME);
      Logger.log(`Label "${LABEL_NAME}" created successfully.`);
    } catch (e) {
      Logger.log(`Failed to create label "${LABEL_NAME}": ${e.message}`);
      return; // Stop if we can't create the label
    }
  }

  // Filter by airline (YOU MAY ADD OTHER FILTERS HERE)
  const filters = [
    { from: "DeltaAirLines@t.delta.com", subject: "Your Flight Receipt" },
    { from: "DeltaAirLines@t.delta.com", subject: "Congrats on Your SkyMiles Award Trip" },
    { from: "DeltaAirLines@e.delta.com", subject: "Your Flight Receipt" },
    { from: "Receipts@united.com", subject: "eTicket Itinerary and Receipt for" },
    { from: "no-reply@notify.email.aa.com", subject: "Your trip confirmation" },
    { from: "jetblueairways@email.jetblue.com", subject: "JetBlue booking confirmation for" },
    { from: "southwestairlines@ifly.southwest.com", subject: "You're going to" },
    { from: "booking@fly.spirit-airlines.com", subject: "Spirit Airlines Flight Confirmation" },
    { from: "service@ifly.alaskaair.com", subject: "Your confirmation receipt:" },
  ];

  let totalMessagesForwarded = 0;

  filters.forEach((filter, index) => {
    // Updated searchQuery to include the 'before:' date filter.
    const searchQuery = `from:${filter.from} subject:"${filter.subject}" -subject:Fwd: -label:${LABEL_NAME}`;
    Logger.log(`Processing filter ${index + 1}: ${searchQuery}`);

    const threads = GmailApp.search(searchQuery);
    Logger.log(`Found ${threads.length} thread(s) matching this filter.`);

    threads.forEach((thread) => {
      const messages = thread.getMessages();
      // Process only the first message in the thread, assuming it's the original receipt
      if (messages.length > 0) {
        const message = messages[0]; // Get the first message
       
        // Double-check if the thread already has the label. 
        // This is a safeguard, though the search query should already handle it.
        const threadLabels = thread.getLabels();
        let alreadyProcessed = false;
        for (const lbl of threadLabels) {
          if (lbl.getName() === LABEL_NAME) {
            alreadyProcessed = true;
            break;
          }
        }

        if (alreadyProcessed) {
          Logger.log(`Skipping already labeled thread: ${thread.getFirstMessageSubject()}`);
          return; // Skip to the next thread
        }

        const originalSender = message.getFrom();
        const originalBody = message.getBody(); // HTML

        const annotatedBody = `
        Original Sender: ${originalSender}
        <hr>
        ${originalBody}
        `;

        try {
          message.forward(forwardingAddress, {
            htmlBody: annotatedBody
          });
         
          Logger.log(
            `Forwarded original message from: ${message.getFrom()}, subject: ${message.getSubject()}`
          );
         
          // Apply the label to the thread after forwarding
          if (label) {
            thread.addLabel(label);
            Logger.log(`Applied label "${LABEL_NAME}" to thread: ${thread.getFirstMessageSubject()}`);
          }
         
          totalMessagesForwarded++;
          Utilities.sleep(2500); // Wait for 2.5 seconds to avoid hitting Gmail rate limits
        } catch (e) {
          Logger.log(`Error forwarding message: ${message.getSubject()}. Error: ${e.message}`);
        }
      }
    });

    Logger.log(`Finished filter ${index + 1}.`);
  });

  Logger.log(`Script completed. Total messages forwarded: ${totalMessagesForwarded}`);
}
