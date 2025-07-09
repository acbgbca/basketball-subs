This contains some prompt templates that I have found useful when making changes to the application.

# Specific Change

## Outline the changes required

```markdown

```

# Major Change

Unless we are making a trivial change, I have found that using the following structure works best. Start a new AI chat for each section. That ensures we keep the context window small, and also ensures that the files contain everything we need to implement the change.

### WORK IN PROGRESS

Currently the prompts below have the AI spending a lot of time reading the requirements, and none actually looking at the code. This means it often asks what the code does instead of checking, and asks questions about validation that are already answered by the code.

I probably need to spend more time on the docs/summary.md file, and on tweaking the prompts to force it to read the code.

## Create the requirements
Tell the AI we are making a new change. Ask it to ask questions to clarify the requirements, and output a detailed requirements document to human.md

```markdown
We are generating a requirements document for a new feature, the summary is below the break. Please analyse the application to get some context, and then ask questions to clarify the requirements. You may ask multiple rounds of questions if required. Once you fully understand the requirements generate a complete list of data model, service, interface, and testing, and other changes required to meet the requirements. The full requirements document should be captured in the human.md file.

---

<insert summary>
```

## Clarify the requirements
After we have created the requirements, start a new chat and ask the AI to read them and ask questions to clarify any questions that it has. In this way we ensure that the requirements cover everything and make sure nothing is missed

```markdown
The requirements and changes required for a new feature are outlined in the human.md file. Please read the file, and ask questions to clarify any requirements or changes that are unclear. Once you have confirmed your understanding, update the documentation in the human.md file to clarify the requirements and all changes that are required.
```

## Convert the requirements to AI instrucyions
Next step is to summarise and convert the file into a list of tasks for the AI. Again, start a new chat and pass in the file.

```markdown
The requirements and changes required for a new feature are outlined in the human.md file. Please read the file, and then analyse the existing application. Convert the requirements into a list of instructions for an AI to make those changes on the code base. The instructions should use Markdown task syntax, and clearly outline to the AI the exact changes that need to be made. Output these instructions to an ai.md file.
```

## Implement the changes
* Start another new chat. Ask the AI to implement the changes based on ai.md
```markdown
Read the ai.md file and implement the changes as outlined.
```

Why use files:
AIs have a limited context window. Rather than continuing a long conversation, it makes more sense to summarise it in a document than can be referenced across several chats

