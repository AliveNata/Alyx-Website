import {
  Project,
  Experience,
  TechStack,
  Certificate,
  Achievement,
} from "../types";

export const AI_CHAT_CONTEXT = {
  introduction:
    "Hi! I'm Alyx's AI Assistant. I can help you learn more about Alief Akbar:",
  topics: [
    "Professional experience in Business Intelligence and Data Analysis",
    "Technical skills and projects",
    "Educational background and certifications",
    "Potential collaboration opportunities",
  ],
  suggestedQuestionsTree: [
    {
      question: "What are Alief's key skills in data analysis?",
      answer:
        "Alief is proficient in data analysis tools like Python, SQL, BigQuery, and various BI platforms. He also has experience with web development technologies.",
      followUps: [
        {
          question: "Tell me more about Python skills",
          answer:
            "Alief has used Python for data cleaning, automation, and visualization with libraries like pandas, matplotlib, and seaborn.",
          followUps: [
            {
              question: "What Python libraries does he use?",
              answer:
                "Alief primarily uses pandas for data manipulation, matplotlib and seaborn for visualization, and scikit-learn for machine learning tasks.",
            },
          ],
        },
        {
          question: "What BI platforms does Alief use?",
          answer:
            "He works with Looker, Tableau, Power BI, and Google Data Studio for creating interactive dashboards and reports.",
        },
      ],
    },
    {
      question: "Tell me about Alief's experience with BI tools",
      answer:
        "Alief has extensive experience working with BI tools such as Looker, BigQuery, and Apache projects, delivering dashboards and reports for business insights.",
      followUps: [
        {
          question: "What kind of dashboards has he built?",
          answer:
            "He has built sales performance dashboards, customer analytics dashboards, and operational KPI tracking systems.",
        },
      ],
    },
    {
      question: "What kind of projects has Alief worked on?",
      answer:
        "Alief has worked on projects like sales analysis dashboards, classification clustering systems, and eTicketing web apps.",
      followUps: [
        {
          question: "Tell me about the eTicketing project",
          answer:
            "The eTicketing web app includes features like QR code validation, analytics dashboard, and payment integration for enhanced user experience.",
        },
      ],
    },
    {
      question: "Is Alief available for freelance work?",
      answer:
        "Yes, Alief is available for freelance work and collaborations. You can contact him via email at alivenata@gmail.com.",
      followUps: [
        {
          question: "What type of work is he looking for?",
          answer:
            "Alief is interested in data analysis, BI development, and web development projects, both remote and on-site opportunities.",
        },
      ],
    },
    {
      question: "Let's play some games!",
      answer: "Great! Which game would you like to play? Choose one:",
      followUps: [
        {
          question: "Fun Riddles",
          answer:
            "Let's test your riddle-solving skills! Choose a difficulty: Easy, Medium, or Hard?",
          followUps: [
            {
              question: "Easy Riddles",
              answer:
                "Alright, choose your riddle: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question: "Question 1: What always comes but never arrives?",
                  answer:
                    "Here's a tricky one for you! Below are the available answers:",
                  followUps: [
                    {
                      question: "Tomorrow",
                      answer:
                        "Correct! Tomorrow always comes but never arrives.",
                    },
                    {
                      question: "Today",
                      answer: "Close, but not quite! Try again.",
                    },
                    {
                      question: "Next week",
                      answer: "Not quite. Try again!",
                    },
                  ],
                },
                {
                  question: "Question 2: What has keys but can't open locks?",
                  answer:
                    "What do you think it is? Below are the available answers:",
                  followUps: [
                    {
                      question: "A piano",
                      answer: "Correct! A piano has keys but can't open locks.",
                    },
                    {
                      question: "A car",
                      answer: "Not quite. Try again!",
                    },
                    {
                      question: "A computer",
                      answer: "Close, but not the right answer. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: I am tall when I am young, and short when I am old. What am I?",
                  answer:
                    "Try to solve this riddle, below are the available answers:",
                  followUps: [
                    {
                      question: "A candle",
                      answer:
                        "Correct! A candle is tall when it's young and short when it's old.",
                    },
                    {
                      question: "A tree",
                      answer: "Close, but that's not correct. Try again!",
                    },
                    {
                      question: "A person",
                      answer: "Not correct, try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Medium Riddles",
              answer:
                "Now, a medium difficulty! Choose your riddle: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: The more you take, the more you leave behind. What am I?",
                  answer:
                    "Here’s a tricky one! Below are the available answers:",
                  followUps: [
                    {
                      question: "Footsteps",
                      answer:
                        "Correct! The more footsteps you take, the more you leave behind.",
                    },
                    {
                      question: "Time",
                      answer: "Not quite. Try again!",
                    },
                    {
                      question: "Memories",
                      answer:
                        "That's a creative guess, but not quite. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: What comes once in a minute, twice in a moment, but never in a thousand years?",
                  answer:
                    "Think you can solve this riddle? Below are the available answers:",
                  followUps: [
                    {
                      question: "The letter M",
                      answer:
                        "Correct! The letter M appears once in a minute, twice in a moment.",
                    },
                    {
                      question: "Time",
                      answer: "Not quite. Try again!",
                    },
                    {
                      question: "Eternity",
                      answer: "That's not correct. Try again!",
                    },
                  ],
                },
                {
                  question: "Question 3: What has a heart that doesn't beat?",
                  answer:
                    "Think you know this one? Below are the available answers:",
                  followUps: [
                    {
                      question: "An artichoke",
                      answer:
                        "Correct! An artichoke has a heart but it doesn't beat.",
                    },
                    {
                      question: "A clock",
                      answer: "Not correct. Try again!",
                    },
                    {
                      question: "A tree",
                      answer: "That's incorrect. Try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Hard Riddles",
              answer:
                "Here's a tough one. Choose your riddle: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
                  answer:
                    "Think you can crack this one? Below are the available answers:",
                  followUps: [
                    {
                      question: "An echo",
                      answer:
                        "Correct! An echo speaks without a mouth and hears without ears.",
                    },
                    {
                      question: "A shadow",
                      answer: "Not quite! Try again.",
                    },
                    {
                      question: "A ghost",
                      answer: "Close, but try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: I can be cracked, I can be made, I can be told, I can be played. What am I?",
                  answer:
                    "Can you guess what can be cracked, made, told, and played?",
                  followUps: [
                    {
                      question: "A joke",
                      answer:
                        "Correct! A joke can be cracked, made, told, and played.",
                    },
                    {
                      question: "A puzzle",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "A secret",
                      answer: "Close, but try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: The person who makes it, sells it. The person who buys it, never uses it. The person who uses it, never knows they're using it. What is it?",
                  answer: "Take a guess, below are the available answers:",
                  followUps: [
                    {
                      question: "A coffin",
                      answer:
                        "Correct! A coffin is made, sold, and used by someone who never knows they're using it.",
                    },
                    {
                      question: "A bed",
                      answer: "Not correct. Try again!",
                    },
                    {
                      question: "A chair",
                      answer: "That's incorrect, try again!",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          question: "Interactive story",
          answer:
            "Awesome! Choose your adventure! Which story would you like to explore?",
          followUps: [
            {
              question: "The Forest Adventure",
              answer:
                "You are Aerin, a young traveler seeking answers. The forest whispers your name. Do you go left into the foggy darkness or right into the golden light?",
              followUps: [
                {
                  question: "Go left",
                  answer:
                    "You enter the foggy path. Soon, a glowing cave appears. Do you explore the cave or walk past it?",
                  followUps: [
                    {
                      question: "Explore the cave",
                      answer:
                        "Inside the cave, you meet Thornal, a small ancient dragon. He asks why you're here. Do you tell him the truth or lie?",
                      followUps: [
                        {
                          question: "Tell the truth",
                          answer:
                            "Thornal senses your sincerity and offers you the Amber of Memory. With it, you see visions of your father's past. Do you accept the vision or resist?",
                          followUps: [
                            {
                              question: "Accept",
                              answer:
                                "You learn your father helped protect this forest. Thornal opens a secret passage leading deeper into the forest.",
                              ending:
                                "Guardian's Awakening - You gain ancient knowledge and take your father's place as the protector of Elnar.",
                              endingType: "Best Ending",
                            },
                            {
                              question: "Resist",
                              answer:
                                "The vision fades. Thornal grows disappointed. The cave darkens and you're gently pushed outside.",
                              ending:
                                "Missed Destiny - You survive, but the forest's secrets remain locked away.",
                              endingType: "Bittersweet Ending",
                            },
                          ],
                        },
                        {
                          question: "Lie",
                          answer:
                            "Thornal growls. He transforms into your greatest fear. You flee the cave, shaken.",
                          ending:
                            "Rejected by the Forest - Your dishonesty leads you away from the path of truth and power.",
                          endingType: "Tragic Ending",
                        },
                      ],
                    },
                    {
                      question: "Walk past it",
                      answer:
                        "You find a mysterious hut. An old hermit invites you in and offers tea that reveals your destiny. Do you drink it?",
                      followUps: [
                        {
                          question: "Drink",
                          answer:
                            "You see your future as the guardian of the forest. You awaken with a totem of power.",
                          ending:
                            "Visionary Future - You embrace your calling and the forest grants you its blessing.",
                          endingType: "Neutral Ending",
                        },
                        {
                          question: "Refuse",
                          answer:
                            "The hermit vanishes. The hut is now empty. You move on, feeling unsure but determined.",
                          ending:
                            "Wanderer's Road - Without guidance, you forge your own uncertain but brave path.",
                          endingType: "Bittersweet Ending",
                        },
                      ],
                    },
                  ],
                },
                {
                  question: "Go right",
                  answer:
                    "You walk along a golden trail and meet a magical fox. It speaks: 'I can show you your destiny, if you trust me.' Do you follow the fox or ignore it?",
                  followUps: [
                    {
                      question: "Follow the fox",
                      answer:
                        "The fox brings you to the Spirit Tree. It asks if you wish to inherit your family's forgotten duty. Do you accept?",
                      followUps: [
                        {
                          question: "Accept",
                          answer:
                            "You gain the Mark of the Forest. The animals begin to follow your lead. A portal opens to an ancient sanctuary.",
                          ending:
                            "Nature's Chosen - You become a living legend, a bridge between mankind and the wild.",
                          endingType: "Best Ending",
                        },
                        {
                          question: "Decline",
                          answer:
                            "The fox disappears into the mist. You're left to find your own path, now more difficult.",
                          ending:
                            "Fated to Stray - You deny your role and wander endlessly in the woods of forgotten purpose.",
                          endingType: "Bittersweet Ending",
                        },
                      ],
                    },
                    {
                      question: "Ignore",
                      answer:
                        "The path vanishes beneath your feet and you fall into a hidden glade. There's a statue of your younger self. Do you touch it?",
                      followUps: [
                        {
                          question: "Touch",
                          answer:
                            "Memories flood your mind. You remember why you entered the forest—to heal. A new trail opens.",
                          ending:
                            "Inner Healing - Through courage and memory, you find peace and your way home.",
                          endingType: "Neutral Ending",
                        },
                        {
                          question: "Step back",
                          answer:
                            "The glade begins to collapse. You must flee or be trapped forever.",
                          ending:
                            "Forest's Judgment - You rejected reflection. The forest swallows its secrets… and you.",
                          endingType: "Tragic Ending",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              question: "The Haunted Mansion",
              answer:
                "You are Elise Caldwell, a curious archaeologist drawn to the cursed Windmere Mansion. The main door creaks open. Do you go inside or look around outside?",
              followUps: [
                {
                  question: "Enter the mansion",
                  answer:
                    "You step into the dim foyer. Two doors await: one red, one blue. Which do you choose?",
                  followUps: [
                    {
                      question: "Choose the red door",
                      answer:
                        "You enter a hall of mirrors. One mirror reflects you as an old woman. Do you approach it or try to break it?",
                      followUps: [
                        {
                          question: "Approach the mirror",
                          answer:
                            "The mirror whispers secrets of your bloodline and offers to show you your fate. Do you accept or refuse?",
                          followUps: [
                            {
                              question: "Accept",
                              answer:
                                "You see your future as the next heir of Windmere. The mirror shatters and a door opens to the family crypt.",
                              ending:
                                "Legacy Restored - You embrace your ancestry and become the protector of Windmere's secrets.",
                              endingType: "Neutral Ending",
                            },
                            {
                              question: "Refuse",
                              answer:
                                "You step back, and the mirror fogs over. The room darkens, and you're left questioning your path.",
                              ending:
                                "Faded Truth - You survive the night, but leave with more questions than answers.",
                              endingType: "Bittersweet Ending",
                            },
                          ],
                        },
                        {
                          question: "Break the mirror",
                          answer:
                            "The shards scream as a ghostly figure is released. You flee down a hidden stairway.",
                          ending:
                            "Accidental Awakening - You unleash a trapped spirit and barely escape. The curse continues.",
                          endingType: "Tragic Ending",
                        },
                      ],
                    },
                  ],
                },
                {
                  question: "Look for clues outside",
                  answer:
                    "You circle the mansion and find a garden maze. A stone statue of a child beckons. Do you follow it or search elsewhere?",
                  followUps: [
                    {
                      question: "Follow the child",
                      answer:
                        "The child leads you to a hidden gazebo. A spectral journal lies open. Do you read it?",
                      followUps: [
                        {
                          question: "Read the journal",
                          answer:
                            "It reveals the mansion was a prison for spirits. You're offered the role of keeper.",
                          ending:
                            "Spirit Keeper - You remain to guide lost souls and watch over Windmere forever.",
                          endingType: "Tragic Ending",
                        },
                        {
                          question: "Close the journal",
                          answer:
                            "The gazebo collapses. You run, but the memory of the mansion haunts you.",
                          ending:
                            "Refused the Call - You flee with your life, but the spirits remain unrested.",
                          endingType: "Neutral Ending",
                        },
                      ],
                    },
                    {
                      question: "Search elsewhere",
                      answer:
                        "You find a grave with your family name. Thunder cracks. The mansion's shadow looms.",
                      ending:
                        "Bloodline Buried - You turn away from your heritage and miss your one chance at truth.",
                      endingType: "Neutral Ending",
                    },
                  ],
                },
              ],
            },
            {
              question: "The Desert Trek",
              answer:
                "You are Rafi Amari, a scholar crossing the Nahar desert to find ruins tied to your missing father. Ahead is a shimmering oasis and a shaded rock with carvings. Where do you go?",
              followUps: [
                {
                  question: "Head to the oasis",
                  answer:
                    "The oasis is real. A woman named Zarah greets you, saying she knew your father. She offers water in exchange for a memory. Do you accept?",
                  followUps: [
                    {
                      question: "Accept the deal",
                      answer:
                        "You give up a childhood memory and gain a map of the stars. Do you follow the map or rest for the night?",
                      followUps: [
                        {
                          question: "Follow the map",
                          answer:
                            "You discover the hidden ruins beneath the sand and awaken ancient machines.",
                          ending:
                            "Ruins of Truth - Your sacrifice leads to the lost city's rediscovery and your father's journal.",
                          endingType: "Tragic Ending",
                        },
                        {
                          question: "Rest for the night",
                          answer:
                            "You awaken to find the map gone and the oasis vanished. Only the sand remains.",
                          ending:
                            "Lost Opportunity - The moment passed, and with it, the path to truth.",
                          endingType: "Tragic Ending",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              question: "Crimson Vow: The Mafia Saga",
              answer:
                "You are Nata Goricx, a feared yet respected Mafia Capo in Caelus. One night at your casino, you meet a mysterious woman named Yupi Coklat. She’s smart, deadly, and from a rival gang. Do you confront her or invite her for a private game?",
              followUps: [
                {
                  question: "Invite her for a private game",
                  answer:
                    "She agrees. As you play poker, your chemistry grows. She hints at a past involving a dead sibling. Do you open up about your own past or stay silent?",
                  followUps: [
                    {
                      question: "Open up",
                      answer:
                        "You tell her about your rise, and how you once killed your own cousin for betraying the family.",
                      followUps: [
                        {
                          question: "Ask about her brother",
                          answer:
                            "She reveals her brother was killed by someone wearing your gang’s crest. Do you offer to investigate?",
                          followUps: [
                            {
                              question: "Offer to investigate",
                              answer:
                                "You task your enforcer to quietly investigate. Days later, the killer is revealed: your right-hand man. Do you execute him or exile him?",
                              followUps: [
                                {
                                  question: "Execute him",
                                  answer:
                                    "Blood spills on the floor of the garage. Yupi watches, conflicted. You tell her, 'I did this for us.'",
                                  followUps: [
                                    {
                                      question: "Propose a truce to her gang",
                                      answer:
                                        "You and Yupi meet her gang leaders in Bluebay. Talks are tense. Do you offer a business deal or marriage alliance?",
                                      followUps: [
                                        {
                                          question: "Business deal",
                                          answer:
                                            "The truce holds, but tensions remain. However, you and Yupi grow closer in secret.",
                                          followUps: [
                                            {
                                              question:
                                                "Reveal the relationship publicly",
                                              answer:
                                                "It shocks both gangs — but earns unexpected respect.",
                                              followUps: [
                                                {
                                                  question:
                                                    "The Wedding at the Vineyard",
                                                  answer:
                                                    "Months later, after bloodshed and betrayal, Nata and Yupi stand under a flowered arch in a Tuscan-style vineyard. The guests: family, mafia, gang leaders. A toast is made. The city watches silently. Peace? Or pause?",
                                                  ending:
                                                    "Crimson Vow – Love ends the war, but peace in Caelus is always temporary.",
                                                  endingType: "Best Ending",
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          question: "Marriage alliance",
                                          answer:
                                            "Yupi hesitates, unsure if this is love or politics. Do you give her time or insist?",
                                          followUps: [
                                            {
                                              question: "Give her time",
                                              answer:
                                                "She returns days later and kisses you. 'Let’s do this together.'",
                                              followUps: [
                                                {
                                                  question:
                                                    "The Wedding at the Vineyard",
                                                  answer:
                                                    "Months later, after bloodshed and betrayal, Nata and Yupi stand under a flowered arch in a Tuscan-style vineyard. The guests: family, mafia, gang leaders. A toast is made. The city watches silently. Peace? Or pause?",
                                                  ending:
                                                    "Crimson Vow – Love ends the war, but peace in Caelus is always temporary.",
                                                  endingType: "Best Ending",
                                                },
                                              ],
                                            },
                                            {
                                              question: "Insist now",
                                              answer:
                                                "She vanishes. Rumors spread she returned to Sweet Venom leadership.",
                                              ending:
                                                "Cracked Vow – You tried to force fate. She won’t be owned.",
                                              endingType: "Tragic Ending",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  question: "Exile him",
                                  answer:
                                    "He vows revenge. Days later, a hit is made on Yupi's life. She survives. Do you track him down or lie to Yupi?",
                                  followUps: [
                                    {
                                      question: "Track him down",
                                      answer:
                                        "You find him working with a rival gang. You eliminate him, ending the threat.",
                                      next: {
                                        question: "The Wedding at the Vineyard",
                                        answer:
                                          "Months later, after bloodshed and betrayal, Nata and Yupi stand under a flowered arch in a Tuscan-style vineyard. The guests: family, mafia, gang leaders. A toast is made. The city watches silently. Peace? Or pause?",
                                        ending:
                                          "Crimson Vow – Love ends the war, but peace in Caelus is always temporary.",
                                        endingType: "Best Ending",
                                      },
                                    },
                                    {
                                      question: "Lie to Yupi",
                                      answer:
                                        "She discovers the truth and walks away. 'We built this on a lie.'",
                                      ending:
                                        "Love Lost – A kingdom built on secrets cannot stand.",
                                      endingType: "Tragic Ending",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              question: "Tell her to move on",
                              answer:
                                "She leaves the room silently. Days later, you're ambushed by her gang in Bluebay.",
                              ending:
                                "Betrayed Heart – You lose both love and territory in a single night.",
                              endingType: "Tragic Ending",
                            },
                          ],
                        },
                        {
                          question: "Change the subject",
                          answer:
                            "You share drinks. Tension remains, but the chemistry is undeniable. Later, you kiss under the casino lights.",
                          ending:
                            "Dangerous Desire – Your love blooms, but the truth still lurks beneath.",
                          endingType: "Neutral Ending",
                        },
                      ],
                    },
                    {
                      question: "Stay silent",
                      answer:
                        "She respects your silence. Before leaving, she whispers: 'I see pain behind your eyes.'",
                      ending:
                        "Silent Bond – Trust begins to grow, slowly but dangerously.",
                      endingType: "Bittersweet Ending",
                    },
                  ],
                },
                {
                  question: "Confront her about her gang",
                  answer:
                    "She smiles coldly. 'You think only you rule this city?' She pulls out a hidden blade. Do you fight or disarm her?",
                  followUps: [
                    {
                      question: "Disarm her",
                      answer:
                        "You grab her wrist. The guards rush in, but you stop them. 'Let her go,' you say.",
                      followUps: [
                        {
                          question: "Meet her later",
                          answer:
                            "You find her at the Rustzone market. You apologize. She agrees to a drink.",
                          ending:
                            "Unlikely Allies – A truce forms, and love begins where rivalry once stood.",
                          endingType: "Best Ending",
                        },
                        {
                          question: "Threaten her",
                          answer:
                            "She vanishes. Two days later, three of your trucks explode in the docks.",
                          ending:
                            "Gang War Reignited – Love crushed by paranoia and control.",
                          endingType: "Tragic Ending",
                        },
                      ],
                    },
                    {
                      question: "Fight her",
                      answer:
                        "You clash in the casino VIP room. She cuts your cheek but you hold her down.",
                      followUps: [
                        {
                          question: "Let her go",
                          answer:
                            "She vanishes, but sends you a note: 'You bleed for me. Maybe we’re not enemies.'",
                          ending:
                            "Respect Through War – Violence births reluctant affection.",
                          endingType: "Bittersweet Ending",
                        },
                        {
                          question: "Keep her hostage",
                          answer:
                            "You try to use her as leverage. Her gang retaliates, burning your Rustzone lab.",
                          ending:
                            "Power Play – You gain nothing and lose more.",
                          endingType: "Tragic Ending",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          question: "Casual Trivia Quiz",
          answer:
            "Ready for some trivia? Choose a difficulty: Easy, Medium, or Hard?",
          followUps: [
            {
              question: "Easy Trivia",
              answer:
                "Let's begin! Choose a question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question: "Question 1: What is the capital of France?",
                  answer:
                    "Do you know this one? Below are the available answers:",
                  followUps: [
                    {
                      question: "Paris",
                      answer: "Correct! The capital of France is Paris.",
                    },
                    {
                      question: "London",
                      answer: "Close, but not quite. Try again!",
                    },
                    {
                      question: "Rome",
                      answer: "Not quite, try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: What is the largest planet in our solar system?",
                  answer: "Take a wild guess! Below are the available answers:",
                  followUps: [
                    {
                      question: "Jupiter",
                      answer: "Correct! Jupiter is the largest planet.",
                    },
                    {
                      question: "Saturn",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "Earth",
                      answer: "No, try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: What is the color of the sky on a clear day?",
                  answer: "What’s your guess? Below are the available answers:",
                  followUps: [
                    {
                      question: "Blue",
                      answer: "Correct! The sky is blue on a clear day.",
                    },
                    {
                      question: "Green",
                      answer: "Not quite. Try again!",
                    },
                    {
                      question: "Red",
                      answer: "No, try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Medium Trivia",
              answer:
                "Now, let's move to medium difficulty. Choose a question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: Which planet is known as the Red Planet?",
                  answer:
                    "Think you can get it right? Below are the available answers:",
                  followUps: [
                    {
                      question: "Mars",
                      answer: "Correct! Mars is known as the Red Planet.",
                    },
                    {
                      question: "Venus",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "Jupiter",
                      answer: "No, try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: What is the chemical symbol for water?",
                  answer:
                    "Here’s a quick one! Below are the available answers:",
                  followUps: [
                    {
                      question: "H2O",
                      answer: "Correct! The chemical symbol for water is H2O.",
                    },
                    {
                      question: "O2",
                      answer: "Not correct. Try again!",
                    },
                    {
                      question: "CO2",
                      answer: "No, try again!",
                    },
                  ],
                },
                {
                  question: "Question 3: How many continents are there?",
                  answer: "Give it a shot! Below are the available answers:",
                  followUps: [
                    {
                      question: "7",
                      answer: "Correct! There are 7 continents.",
                    },
                    {
                      question: "6",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "8",
                      answer: "That's incorrect, try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Hard Trivia",
              answer:
                "Let's go for hard trivia now. Choose a question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: Which country has the longest coastline in the world?",
                  answer:
                    "Take a guess! Which country could it be? Below are the available answers:",
                  followUps: [
                    {
                      question: "Canada",
                      answer: "Correct! Canada has the longest coastline.",
                    },
                    {
                      question: "Russia",
                      answer: "Close, but it's Canada. Try again!",
                    },
                    {
                      question: "Australia",
                      answer: "No, try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: What is the hardest natural substance on Earth?",
                  answer:
                    "What do you think it is? Below are the available answers:",
                  followUps: [
                    {
                      question: "Diamond",
                      answer:
                        "Correct! Diamond is the hardest natural substance.",
                    },
                    {
                      question: "Gold",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "Iron",
                      answer: "Close, but not quite. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: Which element has the chemical symbol 'O'?",
                  answer:
                    "Do you know your elements? Below are the available answers:",
                  followUps: [
                    {
                      question: "Oxygen",
                      answer: "Correct! The element 'O' is Oxygen.",
                    },
                    {
                      question: "Osmium",
                      answer: "Not quite. Try again!",
                    },
                    {
                      question: "Ozone",
                      answer: "That's incorrect, try again!",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          question: "Math Quiz",
          answer:
            "Let's test your math skills! Choose a difficulty: Easy, Medium, or Hard?",
          followUps: [
            {
              question: "Easy Math Quiz",
              answer:
                "Alright, here's an easy math question. Choose your question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question: "Question 1: What is 5 + 3?",
                  answer:
                    "Let's test your math skills! Below are the available answers:",
                  followUps: [
                    {
                      question: "8",
                      answer: "Correct! 5 + 3 is indeed 8.",
                    },
                    {
                      question: "6",
                      answer: "Close, but that's not correct. Try again!",
                    },
                    {
                      question: "7",
                      answer: "Not quite, try again!",
                    },
                  ],
                },
                {
                  question: "Question 2: What is 6 + 4?",
                  answer:
                    "Can you solve this one? Below are the available answers:",
                  followUps: [
                    {
                      question: "10",
                      answer: "Correct! 6 + 4 equals 10.",
                    },
                    {
                      question: "9",
                      answer: "Almost! Try again.",
                    },
                    {
                      question: "11",
                      answer: "Not quite, try again!",
                    },
                  ],
                },
                {
                  question: "Question 3: What is 2 x 4?",
                  answer:
                    "Here's a simple one! Below are the available answers:",
                  followUps: [
                    {
                      question: "8",
                      answer: "Correct! 2 x 4 equals 8.",
                    },
                    {
                      question: "7",
                      answer: "Close, but not quite. Try again!",
                    },
                    {
                      question: "6",
                      answer: "That's not correct. Try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Medium Math Quiz",
              answer:
                "Now, a medium difficulty. Choose your question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question: "Question 1: What is 12 x 7?",
                  answer:
                    "Think you can get this? Below are the available answers:",
                  followUps: [
                    {
                      question: "84",
                      answer: "Correct! 12 x 7 equals 84.",
                    },
                    {
                      question: "74",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "82",
                      answer: "Close, but not the right answer. Try again!",
                    },
                  ],
                },
                {
                  question: "Question 2: What is 15 + 25?",
                  answer: "Give it a try! Below are the available answers:",
                  followUps: [
                    {
                      question: "40",
                      answer: "Correct! 15 + 25 equals 40.",
                    },
                    {
                      question: "30",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "50",
                      answer: "That's incorrect. Try again!",
                    },
                  ],
                },
                {
                  question: "Question 3: What is 36 ÷ 4?",
                  answer:
                    "Let's see if you can figure this one out! Below are the available answers:",
                  followUps: [
                    {
                      question: "9",
                      answer: "Correct! 36 ÷ 4 equals 9.",
                    },
                    {
                      question: "8",
                      answer: "Close, but not quite! Try again.",
                    },
                    {
                      question: "7",
                      answer: "Not correct, try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Hard Math Quiz",
              answer:
                "Here's a challenging one: Choose your question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question: "Question 1: What is the square root of 144?",
                  answer:
                    "Here’s a challenging one! Below are the available answers:",
                  followUps: [
                    {
                      question: "12",
                      answer: "Correct! The square root of 144 is 12.",
                    },
                    {
                      question: "14",
                      answer: "That's incorrect. Try again!",
                    },
                    {
                      question: "10",
                      answer: "Close, but that's not the answer. Try again!",
                    },
                  ],
                },
                {
                  question: "Question 2: What is 2^6?",
                  answer:
                    "Do you know the answer to this? Below are the available answers:",
                  followUps: [
                    {
                      question: "64",
                      answer: "Correct! 2^6 equals 64.",
                    },
                    {
                      question: "32",
                      answer: "That's incorrect. Try again!",
                    },
                    {
                      question: "128",
                      answer: "Not correct. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: What is the value of pi rounded to 2 decimal places?",
                  answer:
                    "Here’s a tough one! What is pi rounded to 2 decimal places? Below are the available answers:",
                  followUps: [
                    {
                      question: "3.14",
                      answer:
                        "Correct! Pi rounded to 2 decimal places is 3.14.",
                    },
                    {
                      question: "3.00",
                      answer: "Not quite. Try again!",
                    },
                    {
                      question: "3.141",
                      answer: "Close, but the answer is rounded. Try again!",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          question: "Who Am I Quiz",
          answer:
            "Let's test your knowledge! Choose a difficulty: Easy, Medium, or Hard?",
          followUps: [
            {
              question: "Easy Who Am I",
              answer:
                "Alright, let's start! Choose a question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: I am the largest mammal on Earth. Who am I?",
                  answer: "Take a guess! Below are the available answers:",
                  followUps: [
                    {
                      question: "Blue Whale",
                      answer:
                        "Correct! The Blue Whale is the largest mammal on Earth.",
                    },
                    {
                      question: "Elephant",
                      answer: "Close, but not quite! Try again.",
                    },
                    {
                      question: "Giraffe",
                      answer: "Not quite, try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: I have a long neck and I live in Africa. Who am I?",
                  answer:
                    "Can you figure it out? Below are the available answers:",
                  followUps: [
                    {
                      question: "Giraffe",
                      answer:
                        "Correct! The Giraffe is known for its long neck.",
                    },
                    {
                      question: "Elephant",
                      answer: "Close, but that's not correct. Try again!",
                    },
                    {
                      question: "Lion",
                      answer: "That's incorrect. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: I am the fastest land animal. Who am I?",
                  answer: "What do you think? Below are the available answers:",
                  followUps: [
                    {
                      question: "Cheetah",
                      answer:
                        "Correct! The Cheetah is the fastest land animal.",
                    },
                    {
                      question: "Lion",
                      answer: "Close, but not quite! Try again.",
                    },
                    {
                      question: "Elephant",
                      answer: "That's incorrect. Try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Medium Who Am I",
              answer:
                "Alright, let's try medium difficulty. Choose a question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: I am known as the king of the jungle. Who am I?",
                  answer: "Guess who it is? Below are the available answers:",
                  followUps: [
                    {
                      question: "Lion",
                      answer:
                        "Correct! The Lion is known as the king of the jungle.",
                    },
                    {
                      question: "Tiger",
                      answer: "Close, but not quite. Try again!",
                    },
                    {
                      question: "Elephant",
                      answer: "That's incorrect. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: I live in the desert and have a hump. Who am I?",
                  answer:
                    "Which animal is this? Below are the available answers:",
                  followUps: [
                    {
                      question: "Camel",
                      answer: "Correct! The Camel is known for its hump.",
                    },
                    {
                      question: "Giraffe",
                      answer: "No, try again!",
                    },
                    {
                      question: "Horse",
                      answer: "Not correct, try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: I am a black and white bear that loves bamboo. Who am I?",
                  answer: "Take a guess! Below are the available answers:",
                  followUps: [
                    {
                      question: "Panda",
                      answer: "Correct! The Panda loves bamboo.",
                    },
                    {
                      question: "Koala",
                      answer: "No, try again!",
                    },
                    {
                      question: "Sloth",
                      answer: "That's incorrect. Try again!",
                    },
                  ],
                },
              ],
            },
            {
              question: "Hard Who Am I",
              answer:
                "Here's a tough one. Choose your question: Question 1, Question 2, or Question 3?",
              followUps: [
                {
                  question:
                    "Question 1: I am a nocturnal mammal that can fly. Who am I?",
                  answer:
                    "Can you guess which mammal this is? Below are the available answers:",
                  followUps: [
                    {
                      question: "Bat",
                      answer: "Correct! A Bat can fly and is nocturnal.",
                    },
                    {
                      question: "Owl",
                      answer: "Close, but try again!",
                    },
                    {
                      question: "Raven",
                      answer: "Not correct. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 2: I am an aquatic mammal with a large tusk. Who am I?",
                  answer:
                    "What animal has large tusks and lives in the water? Below are the available answers:",
                  followUps: [
                    {
                      question: "Walrus",
                      answer: "Correct! The Walrus has tusks.",
                    },
                    {
                      question: "Seal",
                      answer: "Not quite, try again!",
                    },
                    {
                      question: "Otter",
                      answer: "Close, but not quite. Try again!",
                    },
                  ],
                },
                {
                  question:
                    "Question 3: I am a bird that cannot fly and is native to New Zealand. Who am I?",
                  answer:
                    "Which bird could this be? Below are the available answers:",
                  followUps: [
                    {
                      question: "Kiwi",
                      answer: "Correct! The Kiwi is native to New Zealand.",
                    },
                    {
                      question: "Penguin",
                      answer: "Close, but not the right answer. Try again!",
                    },
                    {
                      question: "Ostrich",
                      answer: "Not correct. Try again!",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const PROFILE_PHOTO =
  "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Sales Analysis Dashboard",
    description:
      "A dashboard analyzing sales data from a retail store. It includes key metrics such as total sales, top-selling products, and sales trends over time.",
    technologies: ["Looker", "BigQuery", "Apache"],
    image: "https://i.imgur.com/IiNRnsF.jpg",
    github:
      "https://github.com/AliveNata/Business-Intelligence-Portfolio/tree/main/BI%20Portofolio/Sales%20Analysis%20Dashboard",
    link: "-",
  },
  {
    id: 2,
    title: "Classification Form Upload",
    description:
      "A project that user segments based on their provinces behavior using classification clustering by their upload files.",
    technologies: ["MySQL 8.0", "React.JS", "Node.JS"],
    image: "https://i.imgur.com/aUBBSsZ.jpg",
    github:
      "https://github.com/AliveNata/Business-Intelligence-Portfolio/tree/main/BI%20Portofolio/Classification%20Form%20Upload",
    link: "-",
  },
  {
    id: 3,
    title: "NBA Player Stats Data Analysis 2023-2024",
    description:
      "A comprehensive dashboard for tracking cryptocurrency prices, trends, and portfolio performance with real-time updates.",
    technologies: ["Python (Jupyter Notebook)", "PostgreeSQL", "Spreadsheet"],
    image: "https://i.imgur.com/rMjzkvp.jpg",
    github:
      "https://github.com/AliveNata/Business-Intelligence-Portfolio/tree/main/BI%20Portofolio/NBA%20Player%20Stats%20Data%20Analysis%202023-2024",
    link: "-",
  },
  {
    id: 4,
    title: " eTicketing Web Based (Top Ticket)",
    description:
      "Creating a web-based eTicketing system aims to simplify, secure, and enhance efficiency in ticket sales for both large and small events. With features such as automation, QR code validation, analytics dashboard, and payment integration, the system can provide a better experience for both users and event organizers.",
    technologies: ["Laravel", "MySQL", "PHP", "CSS"],
    image: "https://i.imgur.com/Qcu0x2s.jpg",
    github: "https://github.com",
    link: "https://toptiket.my.id/",
  },
];

export const EXPERIENCES: Experience[] = [
  {
    id: 1,
    role: "Regional Business Intelligence Analyst",
    company: "Intrepid Group Asia",
    duration: "Jan 2022 - Oct 2024",
    description: [
      "Develop and manage BI strategies and projects",
      "Cross-departmental collaboration and reporting",
      "Standardization and optimization of data models",
    ],
    technologies: [
      "BigQuery",
      "AppScript",
      "Python",
      "Looker",
      "Apache",
      "Spreadsheet",
      "CRM Tools",
      "Project Management Tools",
    ],
    type: "it",
  },
  {
    id: 2,
    role: "Business & Data Analyst",
    company: "Fabelio Projects",
    duration: "Dec 2019 - Jan 2022",
    description: [
      "Build and manage business flow and data warehouse",
      "Data presentation and reporting",
      "Visualization development and data integration",
    ],
    technologies: [
      "BigQuery",
      "AppScript",
      "Python",
      "Looker",
      "Google Analytics",
      "Spreadsheet",
      "CRM Tools",
      "Project Management Tools",
    ],
    type: "it",
  },
  {
    id: 3,
    role: "IT Management Information System",
    company: "PT. Suzuki Finance Indonesia",
    duration: "Oct 2018 - Dec 2019",
    description: [
      "Creating reports to system with query in SQL server, manage trigger jobs, store procedures and schedulers data",
      "Developed report into app or email",
      "Development business requirements from request user, analyst data for board of directors",
    ],
    technologies: ["HTML/CSS", "C++", "SQL Server", "SSRS", "SSIS", "Excel"],
    type: "it",
  },
  {
    id: 4,
    role: "IT Quality Assurance Manual",
    company: "PT. Suzuki Finance Indonesia",
    duration: "Mar 2018 - Oct 2018",
    description: [
      "Test Planning and Quality Assurance",
      "Validation and Compliance Testing",
      "Backend Testing and Deployment",
    ],
    technologies: [
      "SQL Server",
      "SSMS",
      "Selenium",
      "Jira",
      "Postman",
      "Excel",
    ],
    type: "it",
  },
  {
    id: 5,
    role: "Social Media Specialist",
    company: "PT Kudo Teknologi Indonesia (KUDO)",
    duration: "Feb 2016 - Dec 2017",
    description: [
      "Handling Agent Issues on Social Media",
      "Escalation to IT Helpdesk Team",
      "Bridge Between Digital Marketing and Users",
    ],
    type: "non-it",
  },
  {
    id: 6,
    role: "Customer Loyalty",
    company: "Zalora Indonesia",
    duration: "Nov 2014 - Jul 2015",
    description: [
      "Customer Transaction Support",
      "Logistics Coordination and Follow-up",
      "Customer Engagement and Voucher Distribution",
    ],
    type: "non-it",
  },
  {
    id: 7,
    role: "Technician Support 'Apple Service Provider'",
    company: "eStore",
    duration: "Jan 2013 - Aug 2013",
    description: [
      "Technical Support for Apple Devices",
      "Hardware and Software Services",
      "Consultation and Product Reservations",
    ],
    type: "non-it",
  },
  {
    id: 8,
    role: "HRIS Staff",
    company: "TVRI Nasional",
    duration: "May 2012 - Jul 2012",
    description: [
      "Employee Data Management with Haermes HRMS",
      "Payroll System Integration",
      "Internship Program Coordination",
    ],
    type: "non-it",
  },
  {
    id: 9,
    role: "Waiter",
    company: "Benihana Restaurant",
    duration: "Jul 2011 - Mar 2012",
    description: [
      "Teppan and À la Carte Service",
      "Event Support and Food Running",
      "Order Entry and System Management",
    ],
    type: "non-it",
  },
];

export const TECH_STACK: TechStack[] = [
  {
    category: "All Technologies",
    items: [
      { name: "PostgreSQL", icon: "database", color: "#336791" },
      { name: "BigQuery", icon: "databaseBackup", color: "#FFFFFF" },
      { name: "MySQL", icon: "database", color: "#DC382D" },
      { name: "Apache", icon: "fan", color: "#FF9900" },
      { name: "Formula", icon: "radical", color: "#C21325" },
      { name: "Looker", icon: "bookCheck", color: "#FFCA28" },
      { name: "Tableau", icon: "fileText", color: "#339933" },
      { name: "Power BI", icon: "fileCode", color: "#E535AB" },
      { name: "Python", icon: "braces", color: "#336791" },
      { name: "VS Code", icon: "code2", color: "#007ACC" },
      { name: "React", icon: "react", color: "#61DAFB" },
      { name: "TypeScript", icon: "fileType", color: "#3178C6" },
      { name: "JavaScript", icon: "fileCode", color: "#F7DF1E" },
      { name: "HTML", icon: "code", color: "#E34F26" },
      { name: "CSS", icon: "palette", color: "#1572B6" },
      { name: "Tailwind", icon: "wind", color: "#38B2AC" },
      { name: "Node.js", icon: "server", color: "#339933" },
      { name: "Express", icon: "serverCog", color: "#000000" },
      { name: "MongoDB", icon: "databaseZap", color: "#47A248" },
      { name: "Git", icon: "gitBranch", color: "#F05032" },
      { name: "Figma", icon: "figma", color: "#F24E1E" },
    ],
  },
];

export const ABOUT_ME = {
  title: "About Me",
  description: [
    "Hi, I'm Aliv, a data professional with 6+ years of experience turning complex data into sharp, actionable business strategies. Proven track record in enabling smarter decision-making through powerful data visualizations, in-depth analysis, and interactive dashboards.",
    "Proficient in a wide range of tools and technologies including ETL & BI tools, SQL, NoSQL, Python, Excel/Google Sheets, Jupyter Notebook, Data Visualization, Automated Reporting, and various CRM & Project Management tools such as Trello, Zendesk, Notion, Monday.com, Asana, and Jira.",
    "I've worked across industries and with regional teams to deliver impactful, data-driven solutions that truly make a difference.",
    "Interested in collaborating or chatting about anything data-related? Feel free to connect and drop me a DM.",
  ],
  interests: [
    "Business Intelligence",
    "Artificial Intelligence",
    "Analysist, Scientist and Engineer",
    "Web Development",
    "Machine Learning",
  ],
};

export const CERTIFICATES: Certificate[] = [
  {
    id: 1,
    title: "R Fundamental for Data Science",
    description: "Professional certification in R for Data Science",
    issuer: "DQLab",
    date: "2021",
    animation: "https://assets2.lottiefiles.com/packages/lf20_w51pcehl.json",
    link: "https://academy.dqlab.id/certificate/pdf/DQLABINTR1WKRBWW",
  },
  {
    id: 2,
    title: "Basic Data Visualization using Google Sheet",
    description:
      "Basic Formula techniques for data visualization for analysis and business intelligence applications",
    issuer: "Glints",
    date: "2020",
    animation: "https://assets5.lottiefiles.com/packages/lf20_qp1q7mct.json",
    link: "https://glints-dashboard.s3.ap-southeast-1.amazonaws.com/expert-class-certificates/alief-akbar-online-glintsexpertclass-data-visualization-series-i-basic-data-visualization-using-google-sheet-certificate-20200823-060000.pdf",
  },
  {
    id: 3,
    title: "Python Fundamental for Data Science",
    description: "Professional certification in Python for Data Science",
    issuer: "DQLab",
    date: "2025",
    animation: "https://assets8.lottiefiles.com/packages/lf20_2znxgjyt.json",
    link: "https://academy.dqlab.id/",
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    title: "Data Visualization Expert",
    description:
      "Created impactful dashboards that improved data accessibility across 5 departments",
    animation: "https://assets2.lottiefiles.com/packages/lf20_puciaact.json",
    metrics: [
      { icon: "award", text: "Best Dashboard Design" },
      { icon: "building", text: "Intrepid Group Asia" },
      { icon: "medal", text: "Cross-Department Impact" },
    ],
  },
  {
    id: 2,
    title: "Q2 2020 Top Performers",
    description:
      "Recognized for outstanding contribution in implementing data-driven solutions in Fabelio Projects",
    animation: "https://assets4.lottiefiles.com/packages/lf20_touohxv0.json",
    metrics: [
      { icon: "award", text: "Best Data Initiative 2022" },
      { icon: "building", text: "Fabelio Projects" },
      { icon: "medal", text: "Team Excellence Award" },
    ],
  },
  {
    id: 3,
    title: "Mentoring Formula Class",
    description:
      "Reduced support requests for formula issues by training teams through a structured Formula Class program",
    animation: "https://assets3.lottiefiles.com/packages/lf20_hxart9lz.json",
    metrics: [
      { icon: "award", text: "Formula Class Initiatives" },
      { icon: "building", text: "Fabelio Projects" },
      { icon: "medal", text: "Internal Team Impact" },
    ],
  },
];
