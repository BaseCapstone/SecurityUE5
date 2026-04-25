from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
from datasets import load_dataset



def chunk_text(text, max_tokens=512, stride=128):
    global tokenizer
    tokens = tokenizer.encode(text)
    chunks=[]
    i=0
    while i < len(tokens):
        chunk_tokens = tokens[i:i+max_tokens]
        chunks.append(tokenizer.decode(chunk_tokens, skip_special_tokens=True))
        i += (max_tokens - stride)
    return chunks



def modelSet(model_name):
    global tokenizer, model
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        local_files_only=True
        )
    bnb_config = BitsAndBytesConfig(
        load_in_8bit=True 
    )
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        device_map="auto",
        quantization_config=bnb_config,
    )




def loraSet():
    global model
    lora_config = LoraConfig(
        r=16,               
        lora_alpha=32,      
        target_modules=["q_proj", "v_proj"], 
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, lora_config)




modelSet("../models")
loraSet()

ds = load_dataset("json", data_files="sft_dataset.jsonl", split="train")


def preprocess(example):
    prompt = f"### Instruction:\n{example['instruction']}\n\n### Input:\n{example['input']}\n\n### Response:\n"
    full = prompt + example['output']


    tokenizer.pad_token = tokenizer.eos_token
    model.config.pad_token_id = tokenizer.eos_token_id

    ids = tokenizer(
        full,
        truncation=True,
        max_length=1024,
        padding="max_length"  
    )
    return {
        "input_ids": ids["input_ids"],
        "attention_mask": ids["attention_mask"]
    }


training_args = TrainingArguments(
    output_dir="../lora_models",
    per_device_train_batch_size=16,
    gradient_accumulation_steps=4,
    learning_rate=3e-4,
    fp16=True,
    logging_steps=10,
    save_steps=200,
    num_train_epochs=3,
    save_total_limit=2
)

train_dataset = ds.map(preprocess)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset
)


trainer.train()

model.save_pretrained("../lora_models")
tokenizer.save_pretrained("../lora_models")










