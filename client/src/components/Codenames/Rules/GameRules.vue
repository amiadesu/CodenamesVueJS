<template>
    <div id="edit-clue-panel">
        <h2>
            {{ $t("codenames.panels.edit_clue_panel.edit_clue") }}
        </h2>
        <div>
            Officia quis exercitation enim ea qui pariatur quis laborum. Occaecat ad nulla aute officia nisi do fugiat duis exercitation proident exercitation consequat officia irure. Tempor Lorem ut et minim nisi sunt labore quis incididunt id. Est ad deserunt excepteur cillum veniam.
        </div>
        <div>
            Aliquip adipisicing ex dolore tempor laborum mollit amet minim nisi ex. Proident cupidatat culpa excepteur tempor et pariatur. Ut sit in amet deserunt dolore consequat pariatur exercitation incididunt ullamco tempor dolore ullamco sunt.
        </div>
        <div>
            Elit non ut in proident. Consectetur aliquip anim excepteur adipisicing aliquip esse. Est aute nisi cupidatat quis dolor. Tempor est pariatur et nostrud dolore quis nisi. Amet qui ut et reprehenderit nulla aliqua adipisicing officia commodo.
        </div>
        <div>
            Officia quis exercitation enim ea qui pariatur quis laborum. Occaecat ad nulla aute officia nisi do fugiat duis exercitation proident exercitation consequat officia irure. Tempor Lorem ut et minim nisi sunt labore quis incididunt id. Est ad deserunt excepteur cillum veniam.
        </div>
        <div>
            Aliquip adipisicing ex dolore tempor laborum mollit amet minim nisi ex. Proident cupidatat culpa excepteur tempor et pariatur. Ut sit in amet deserunt dolore consequat pariatur exercitation incididunt ullamco tempor dolore ullamco sunt.
        </div>
        <div>
            Elit non ut in proident. Consectetur aliquip anim excepteur adipisicing aliquip esse. Est aute nisi cupidatat quis dolor. Tempor est pariatur et nostrud dolore quis nisi. Amet qui ut et reprehenderit nulla aliqua adipisicing officia commodo.
        </div>
        <div>
            Officia quis exercitation enim ea qui pariatur quis laborum. Occaecat ad nulla aute officia nisi do fugiat duis exercitation proident exercitation consequat officia irure. Tempor Lorem ut et minim nisi sunt labore quis incididunt id. Est ad deserunt excepteur cillum veniam.
        </div>
        <div>
            Aliquip adipisicing ex dolore tempor laborum mollit amet minim nisi ex. Proident cupidatat culpa excepteur tempor et pariatur. Ut sit in amet deserunt dolore consequat pariatur exercitation incididunt ullamco tempor dolore ullamco sunt.
        </div>
        <div>
            Elit non ut in proident. Consectetur aliquip anim excepteur adipisicing aliquip esse. Est aute nisi cupidatat quis dolor. Tempor est pariatur et nostrud dolore quis nisi. Amet qui ut et reprehenderit nulla aliqua adipisicing officia commodo.
        </div>
        <div>
            Officia quis exercitation enim ea qui pariatur quis laborum. Occaecat ad nulla aute officia nisi do fugiat duis exercitation proident exercitation consequat officia irure. Tempor Lorem ut et minim nisi sunt labore quis incididunt id. Est ad deserunt excepteur cillum veniam.
        </div>
        <div>
            Aliquip adipisicing ex dolore tempor laborum mollit amet minim nisi ex. Proident cupidatat culpa excepteur tempor et pariatur. Ut sit in amet deserunt dolore consequat pariatur exercitation incididunt ullamco tempor dolore ullamco sunt.
        </div>
        <div>
            Elit non ut in proident. Consectetur aliquip anim excepteur adipisicing aliquip esse. Est aute nisi cupidatat quis dolor. Tempor est pariatur et nostrud dolore quis nisi. Amet qui ut et reprehenderit nulla aliqua adipisicing officia commodo.
        </div>
        <div>
            Officia quis exercitation enim ea qui pariatur quis laborum. Occaecat ad nulla aute officia nisi do fugiat duis exercitation proident exercitation consequat officia irure. Tempor Lorem ut et minim nisi sunt labore quis incididunt id. Est ad deserunt excepteur cillum veniam.
        </div>
        <div>
            Aliquip adipisicing ex dolore tempor laborum mollit amet minim nisi ex. Proident cupidatat culpa excepteur tempor et pariatur. Ut sit in amet deserunt dolore consequat pariatur exercitation incididunt ullamco tempor dolore ullamco sunt.
        </div>
        <div>
            Elit non ut in proident. Consectetur aliquip anim excepteur adipisicing aliquip esse. Est aute nisi cupidatat quis dolor. Tempor est pariatur et nostrud dolore quis nisi. Amet qui ut et reprehenderit nulla aliqua adipisicing officia commodo.
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
    computed: {
        
    },
    setup(props) {
        
    },
    data() {
        
    },
    methods: {
        
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#edit-clue-panel {
    width: 100%;
    height: max-content;

    background-color:var(--panel-background-color-2);
    backdrop-filter: blur(3px) saturate(1);
    -webkit-backdrop-filter: blur(3px) saturate(1);

    color: var(--panel-text-color-1);

    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 0.2rem;
}

#edit-clue-panel > h2 {
    font-size: 1.2rem;
    color: var(--panel-header-2-color-1);
}

#edit-clue-input-wrapper {
    width: 90%;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
}

#edit-clue-text-input {
    height: 100%;
    width: 87%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

#edit-clue-number-input {
    height: 100%;
    width: 8%;
    padding: 0.1rem;
    background-color: var(--panel-input-background-color-1);
    border: 1px solid var(--panel-input-border-color-1);
    color: var(--panel-input-text-color-1);
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: 0.25rem;
    display: block;
}

#edit-clue-text-input.inline, #edit-clue-number-input.inline {
    display: inline-block;
}

#edit-clue-text-input:focus, #edit-clue-number-input:focus {
    border-color: var(--panel-input-focus-border-color-1);
    box-shadow: 0 0 0 3px var(--panel-input-focus-box-shadow-color-1);
}

#edit-clue-send-button {
    aspect-ratio: 1 / 1;
    height: 100%;
    width: auto;
    scale: 1.2;

    padding: 4px;

    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

@media screen and (max-width: 1300px) {
    #edit-clue-panel {
        width: 60%;
    }
}

@media screen and (max-width: 1000px) {
    #edit-clue-panel {
        width: 90%;
        height: 25%;
    }
}

@media screen and (max-width: 650px) {
    #edit-clue-input-wrapper {
        width: 95%;
    }

    #edit-clue-text-input {
        width: 80%;
    }

    #edit-clue-number-input {
        width: 12%;
    }
}
</style>