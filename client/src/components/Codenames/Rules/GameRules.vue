<template>
    <div id="codenames-game-rules-content">
        <h1 class="centered">
            {{ $t("codenames.rules.game_rules.title") }}
        </h1>
        <p class="centered">
            <i18n-t keypath="codenames.rules.game_rules.original_rules_link.message_text" tag="span" scope="global">
                <template v-slot:link>
                    <a
                        href="https://fgbradleys.com/wp-content/uploads/rules/codenames%20-%20rules.pdf"
                        class="external-link"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {{ $t('codenames.rules.game_rules.original_rules_link.url_text') }}
                    </a>
                </template>
            </i18n-t>
        </p>

        <h2>
            {{ $t("codenames.rules.game_rules.original_rules_excerpt") }}
        </h2>
        <ul class="enumerated-list">
            <li v-for="(rule, index) in $tm('codenames.rules.game_rules.original_rules')" :key="index">
                <i18n-t :keypath="`codenames.rules.game_rules.original_rules[${index}].text`" tag="span" scope="global">
                    <template v-for="(italic, italicIndex) in rule.italics" #[`italic${italicIndex}`]>
                        <i class="attention-takeover">{{ italic.text }}</i>
                    </template>
                    <template v-for="(word, wordIndex) in rule.words" #[`word${wordIndex}`]>
                        <span class="word-example">{{ word.text }}</span>
                    </template>
                    <template v-for="(section, sectionIndex) in rule.section_links" #[`section${sectionIndex}`]>
                        <a class="section-link" :href="section.link">{{ section.text }}</a>
                    </template>
                    <template v-for="(footnote, footnoteIndex) in rule.footnotes" #[`footnote${footnoteIndex}`]>
                        <a class="footnote-link" :href="footnote.link"><sup>{{ footnote.text }}</sup></a>
                    </template>
                </i18n-t>
                <ul v-if="rule.subrules" class="bullet-list sublist">
                    <li v-for="(subrule, subIndex) in rule.subrules" :key="subIndex">
                        <i18n-t :keypath="`codenames.rules.game_rules.original_rules[${index}].subrules[${subIndex}].text`" tag="span" scope="global">
                            <template v-for="(italic, italicIndex) in subrule.italics" #[`italic${italicIndex}`]>
                                <i class="attention-takeover">{{ italic.text }}</i>
                            </template>
                            <template v-for="(word, wordIndex) in subrule.words" #[`word${wordIndex}`]>
                                <span class="word-example">{{ word.text }}</span>
                            </template>
                            <template v-for="(section, sectionIndex) in subrule.section_links" #[`section${sectionIndex}`]>
                                <a class="section-link" :href="section.link">{{ section.text }}</a>
                            </template>
                            <template v-for="(footnote, footnoteIndex) in subrule.footnotes" #[`footnote${footnoteIndex}`]>
                                <a class="footnote-link" :href="footnote.link"><sup>{{ footnote.text }}</sup></a>
                            </template>
                        </i18n-t>
                    </li>
                </ul>
            </li>
        </ul>

        <h2>
            {{ $t("codenames.rules.game_rules.version_specific_rules") }}
        </h2>
        <ul class="enumerated-list">
            <li v-for="(rule, index) in $tm('codenames.rules.game_rules.version_rules')" :key="index">
                <i18n-t :keypath="`codenames.rules.game_rules.version_rules[${index}].text`" tag="span" scope="global">
                    <template v-for="(italic, italicIndex) in rule.italics" #[`italic${italicIndex}`]>
                        <i class="attention-takeover">{{ italic.text }}</i>
                    </template>
                    <template v-for="(word, wordIndex) in rule.words" #[`word${wordIndex}`]>
                        <span class="word-example">{{ word.text }}</span>
                    </template>
                    <template v-for="(section, sectionIndex) in rule.section_links" #[`section${sectionIndex}`]>
                        <a class="section-link" :href="section.link">{{ section.text }}</a>
                    </template>
                    <template v-for="(footnote, footnoteIndex) in rule.footnotes" #[`footnote${footnoteIndex}`]>
                        <a class="footnote-link" :href="footnote.link"><sup>{{ footnote.text }}</sup></a>
                    </template>
                </i18n-t>
                <ul v-if="rule.subrules" class="bullet-list sublist">
                    <li v-for="(subrule, subIndex) in rule.subrules" :key="subIndex">
                        <i18n-t :keypath="`codenames.rules.game_rules.version_rules[${index}].subrules[${subIndex}].text`" tag="span" scope="global">
                            <template v-for="(italic, italicIndex) in subrule.italics" #[`italic${italicIndex}`]>
                                <i class="attention-takeover">{{ italic.text }}</i>
                            </template>
                            <template v-for="(word, wordIndex) in subrule.words" #[`word${wordIndex}`]>
                                <span class="word-example">{{ word.text }}</span>
                            </template>
                            <template v-for="(section, sectionIndex) in subrule.section_links" #[`section${sectionIndex}`]>
                                <a class="section-link" :href="section.link">{{ section.text }}</a>
                            </template>
                            <template v-for="(footnote, footnoteIndex) in subrule.footnotes" #[`footnote${footnoteIndex}`]>
                                <a class="footnote-link" :href="footnote.link"><sup>{{ footnote.text }}</sup></a>
                            </template>
                        </i18n-t>
                    </li>
                </ul>
            </li>
        </ul>

        <h2 id="game-modes">
            {{ $t('codenames.rules.game_rules.game_modes.title') }}
        </h2>
        <ul class="bullet-list">
            <li v-for="(mode, index) in $tm('codenames.rules.game_rules.game_modes.modes')" :key="index">
                <strong>{{ mode.name }}</strong>
                <p class="block">{{ mode.description }}</p>
                <p v-if="mode.recommendation" class="block">{{ mode.recommendation }}</p>
            </li>
        </ul>

        <h2 id="clues-examples">
            {{ $t('codenames.rules.game_rules.clues_examples.title') }}
        </h2>
        <table>
            <thead>
                <tr>
                    <th v-for="(header, index) in $tm('codenames.rules.game_rules.clues_examples.table.headers')" :key="index" scope="col">
                        {{ header }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, rowIndex) in $tm('codenames.rules.game_rules.clues_examples.table.rows')" :key="rowIndex">
                    <th scope="row">{{ row.words }}</th>
                    <td class="clue-example">{{ row.clue }}</td>
                    <td class="clue-comment">
                        <i18n-t :keypath="`codenames.rules.game_rules.clues_examples.table.rows[${rowIndex}].comment.text`" tag="span" scope="global">
                            <template v-for="(italic, italicIndex) in row.comment.italics" #[`italic${italicIndex}`]>
                                <i class="attention-takeover">{{ italic.text }}</i>
                            </template>
                            <template v-for="(word, wordIndex) in row.comment.words" #[`word${wordIndex}`]>
                                <span class="word-example">{{ word.text }}</span>
                            </template>
                            <template v-for="(section, sectionIndex) in row.comment.section_links" #[`section${sectionIndex}`]>
                                <a class="section-link" :href="section.link">{{ section.text }}</a>
                            </template>
                            <template v-for="(footnote, footnoteIndex) in row.comment.footnotes" #[`footnote${footnoteIndex}`]>
                                <a class="footnote-link" :href="footnote.link"><sup>{{ footnote.text }}</sup></a>
                            </template>
                        </i18n-t>
                    </td>
                </tr>
            </tbody>
        </table>

        <h2 id="footnotes">
            {{ $t('codenames.rules.game_rules.footnotes.title') }}
        </h2>
        <div v-for="(note, index) in $tm('codenames.rules.game_rules.footnotes.notes')" :key="index" :id="note.id">
            <p><sup>({{ index + 1 }}.)</sup> {{ note.text }}</p>
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
    methods: {
        
    },
    mounted() {
        
    },
    beforeUnmount() {
        
    },
});
</script>

<style lang="css" scoped>
#codenames-game-rules-content {
    width: 100%;
    height: max-content;

    color: var(--panel-text-color-3);

    text-indent: 2rem;

    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 0.2rem;
}

#codenames-game-rules-content .centered {
    align-self: center;
}

#codenames-game-rules-content .external-link, .section-link, .footnote-link {
    color: rgb(135, 218, 253);
}

#codenames-game-rules-content .word-example {
    display: inline;
    color: plum;
}

#codenames-game-rules-content .attention-takeover {
    color:aquamarine;
}

#codenames-game-rules-content h1 {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--panel-text-color-3);
}

#codenames-game-rules-content h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--panel-text-color-3);
}

#codenames-game-rules-content h3 {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--panel-text-color-3);
}

#codenames-game-rules-content span.block {
    display: block;
    text-indent: 0;
}

#codenames-game-rules-content ul {
    display: block;
    margin-block-start: 0.3rem;
    margin-block-end: 0.3rem;
    padding-inline-start: 2.5rem;
    text-indent: 0.5rem;
}

#codenames-game-rules-content ul.sublist {
    padding-inline-start: 1.5rem;
    text-indent: 0;
}

#codenames-game-rules-content ul.bullet-list {
    list-style-type: disc;
}

#codenames-game-rules-content ul.enumerated-list {
    list-style-type: decimal;
}

#codenames-game-rules-content table {
    table-layout: fixed;
    width: 90%;
    margin: auto;
    border-collapse: collapse;
}

#codenames-game-rules-content table, th, td {
    border: 1px solid black;
}

#codenames-game-rules-content th, td {
    padding: 0.6em;
}

#codenames-game-rules-content tr :nth-child(1) {
  text-align: left;
  width: 35%;
}

#codenames-game-rules-content tr :nth-child(2), tr .clue-example {
  text-align: center;
  width: 25%;
}

#codenames-game-rules-content tr :nth-child(3), tr .clue-comment {
    text-align: right;
    width: 40%;
}

@media screen and (max-width: 1300px) {
    #codenames-game-rules-content {
        width: 60%;
    }
}

@media screen and (max-width: 1000px) {
    #codenames-game-rules-content {
        width: 90%;
        height: 25%;
    }
}

@media screen and (max-width: 650px) {
    /* #edit-clue-input-wrapper {
        width: 95%;
    }

    #edit-clue-text-input {
        width: 80%;
    }

    #edit-clue-number-input {
        width: 12%;
    } */
}
</style>