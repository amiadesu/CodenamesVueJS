<template>
    <div id="codenames-game-rules-content">
        <h1 class="centered">
            {{ $t("codenames.rules.host_rules.title") }}
        </h1>
        <div class="documentation-wrapper">
            <div
                class="doc-block"
                v-for="(rule, index) in $tm('codenames.rules.host_rules.rules')"
                :key="index"
                :id="rule.id"
            >
                <div
                    class="title-wrapper"
                >
                    <h2 class="doc-block-title">
                        {{ rule.title }}
                    </h2>
                    <div class="input-info-wrapper">
                        <i18n-t v-if="rule.default" :keypath="`codenames.rules.host_rules.rules[${index}].default.text`" tag="span" scope="global">
                            <template v-if="rule.default.type === 'value'" #value>
                                {{ config.defaultGameRules[rule.name].default }}
                            </template>
                            <template v-if="rule.default.type === 'extraValue'" #extraValue>
                                {{ config.defaultGameRules[rule.name][rule.default.index].default }}
                            </template>
                            <template v-if="rule.default.type === 'wordPackValue'" #wordPackValue>
                                {{ config.defaultGameRules[rule.name].packId.default }}
                            </template>
                            <template v-if="rule.default.type === 'boolValue'" #boolValue>
                                {{ $t(`codenames.states.${config.defaultGameRules[rule.name].default}`) }}
                            </template>
                            <template v-if="rule.default.type === 'adminValue'" #adminValue>
                                {{ $t(`codenames.admin.${rule.default.value_path}.${config.defaultGameRules[rule.name].default}`) }}
                            </template>
                        </i18n-t>
                        <i18n-t v-if="rule.min" :keypath="`codenames.rules.host_rules.rules[${index}].min.text`" tag="span" scope="global">
                            <template v-if="rule.min.type === 'value'" #value>
                                {{ config.defaultGameRules[rule.name].min }}
                            </template>
                        </i18n-t>
                        <i18n-t v-if="rule.max" :keypath="`codenames.rules.host_rules.rules[${index}].max.text`" tag="span" scope="global">
                            <template v-if="rule.max.type === 'value'" #value>
                                {{ config.defaultGameRules[rule.name].max }}
                            </template>
                        </i18n-t>
                    </div>
                </div>
                <hr>
                <div class="info-wrapper">
                    <template
                        class="description-row"
                        v-for="(row, rowIndex) in rule.description"
                        :key="rowIndex"
                    >
                        <i18n-t :keypath="`codenames.rules.host_rules.rules[${index}].description[${rowIndex}].text`" tag="p" scope="global">
                            <template v-for="(italic, italicIndex) in row.italics" #[`italic${italicIndex}`]>
                                <i class="attention-takeover">{{ italic.text }}</i>
                            </template>
                            <template v-for="(word, wordIndex) in row.words" #[`word${wordIndex}`]>
                                <span class="word-example">{{ word.text }}</span>
                            </template>
                            <template v-for="(section, sectionIndex) in row.section_links" #[`section${sectionIndex}`]>
                                <a class="section-link" :href="section.link">{{ section.text }}</a>
                            </template>
                            <template v-for="(footnote, footnoteIndex) in row.footnotes" #[`footnote${footnoteIndex}`]>
                                <a class="footnote-link" :href="footnote.link"><sup>{{ footnote.text }}</sup></a>
                            </template>
                            <template v-for="(tab, tabIndex) in row.tabs" #[`tab${tabIndex}`]>
                                <a class="section-link" @click="togglePanel(tab.index, true)">{{ tab.text }}</a>
                            </template>
                            <template v-for="(otherLink, otherLinkIndex) in row.otherLinks" #[`otherLink${otherLinkIndex}`]>
                                <a 
                                    class="section-link" 
                                    @click="() => {togglePanel(otherLink.index); scrollToAnchor(otherLink.link);}"
                                >
                                    {{ otherLink.text }}
                                </a>
                            </template>
                            <template v-for="(link, linkIndex) in row.links" #[`link${linkIndex}`]>
                                <a class="section-link" :href="link.link">{{ link.text }}</a>
                            </template>
                        </i18n-t>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, inject } from 'vue';
import { getConfig } from '@/utils/config';

export default defineComponent({
    inject: ['togglePanel', 'scrollToAnchor'],
    computed: {
        
    },
    data() {
        return {
            config: getConfig()
        }
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

    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    row-gap: 0.2rem;
}

.documentation-wrapper {
    margin: 0 auto;
    width: 100%;
    height: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
    row-gap: 1rem;
}

.doc-block {
    width: 100%;
    max-width: 100%;
    height: 100%;
    background-color: gray;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    overflow: hidden;
    word-wrap: break-word;
}

.title-wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.input-info-wrapper {
    display: flex;
    justify-content: space-evenly;
    column-gap: 2rem;
}

#codenames-game-rules-content .centered {
    text-indent: 0;
    display: block;
    margin: 0 auto;
}

#codenames-game-rules-content .external-link, .section-link, .footnote-link {
    cursor: pointer;
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