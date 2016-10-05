
'use strict';

window.pico = window.pico || {};

pico.Game = class {

    constructor() {

        this.gameElements = {
            'suspects' : {
                editList : '#suspect-list',
                container : '.suspects-container',
                initialList : 'green, scarlet, mustard, plum, white, peacock',
                options : []
            },
            'weapons' : {
                editList : '#weapon-list',
                container : '.weapons-container',
                initialList : 'dagger, wrench, lead pipe, pistol, rope',
                options : []
            },
            'locations' : {
                editList : '#location-list',
                container : '.locations-container',
                initialList : 'dining room, living room, garege, studio, beach',
                options : []
            },
            'players' : {
                editList : '#player-list',
                container : '.players-container',
                initialList : 'paul, ali, tyler, aiden',
                options : []
            },
        };

        $(document).ready(() => {

            this.initializeSection = $('.setup-section');

            // initialize edit controls

            for(var element in this.gameElements) {
                $(this.gameElements[element].editList).val(this.gameElements[element].initialList);
            }

            // set-up events

            $('#define-game').click(() => this.initializeSection.toggle());
            $('#add-players').click(() => this.setUpGameElement('players', this.renderPlayer));
            $('#add-suspects').click(() => this.setUpGameElement('suspects', this.renderSuspects));
            $('#add-weapons').click(() => this.setUpGameElement('weapons', this.renderWeapons));
            $('#add-locations').click(() => this.setUpGameElement('locations', this.renderLocations));

            // Handle selecting response to the question

            $(document).on('click', '.response-button', (event) => this.handleOptionResponseSelectedEvent(event));

            // Handle selecting which option was shown

            $(document).on('click', '.game-element.option-shown', (event) => this.handleOptionShownSelectedEvent(event));

            // Handle Selecting an option

            $(document).on('click', '.game-element.option', (event) => this.renderPossibleAnswers(event));

            // start the game with presets

            ['#add-players', '#add-suspects', '#add-weapons', '#add-locations'].forEach(function(item) {
                $(item).click();
            });

        });
    }

    handleOptionResponseSelectedEvent(event) {
        var game = this;

        // get selected options
        var selectedOptions = $('.option-selected').not('.player').map(function() {
            return {
                'element' : $(this).data().element,
                'name' : $(this).data().option
            };
        });

        // get asker
        var asker = $('.option-selected.players').data().option;

        // get answer
        var questionResponse = $(event.target).html();

        // get responder
        var questionResponder = $(event.target).closest('.response-element').data().option;

        // record
        for (var q = 0; q < selectedOptions.length; q++) {

            var selected = selectedOptions[q];

            var option = $.grep(this.gameElements[selected.element].options, function(option){ return option.name == selected.name;})[0];

            option.responses.push({
                'asker': asker,
                'response' : questionResponse,
                'responder' : questionResponder
            });

        };

        if (questionResponse.toLowerCase() === 'no') {
            // if answer was no, continue.
            // remove that player though as they have answered
            $(event.target).closest('.response-element').hide();
            return;
        } else if (questionResponse.toLowerCase() === 'yes') {
            // update score
            option.score = this.calculateNewOptionScore(option);
            // clear all questions
            $('.game-element').each(function(){ $(this).removeClass('option-selected');});
            // update state
            this.renderPossibleAnswers();
            // end
            return;
        }

        // which was shown?
        this.renderOptions(selectedOptions, '.shown-card-option-container', this.renderElementShownOption);
        $('.shown-card-option-container').show();
    }

    calculateNewOptionScore(option) {
        // get all the options for that elements
        var elements = this.gameElements[option.element];
    }

    /*
     * Option shown selected
     * 1. set the score of that option to highest possible (1)
     * 2. hide card option container
     * 3. remove all selected options
     * 4. update answer container state
     * 5. refresh the option list to show new scores
     */

    handleOptionShownSelectedEvent(event) {
        // get the shown element and option
        var shownElement = $(event.target).data().element;
        var shownOption = $(event.target).data().option;

        // get that option from the game Elements
        var option = $.grep(this.gameElements[shownElement].options, function(option){ return option.name == shownOption;})[0];

        // record game element as shown
        option.score = 1;

        // hide the shown options
        $('.shown-card-option-container').hide();

        // clear all questions
        $('.game-element').each(function(){ $(this).removeClass('option-selected');});

        // update state
        this.renderPossibleAnswers();

        // refresh options
        this.refreshLists();
    }

    /*
     * Render the possible question response options
     */

    renderPossibleAnswers(event) {
        if (event) {
            // update selected option
            $('.game-element', event.target.closest('.content')).each(function(){ $(this).removeClass('option-selected');});
            $(event.target).addClass('option-selected');
        }
        // display possible anwers if all 4 elements have options selected
        if ($('.option-selected').length == 4) {
            var asker = $('.option-selected.players').data().option;
            var responders = this.gameElements.players.options.map(function(option) { return (option.name !== asker) ? option : null; });
            this.renderOptions(responders, $('.responses-container .content'), this.renderResponseOptions);
            $('.responses-container').show();
        } else {
            $('.responses-container').hide();
        }
    }

    /*
     * Render each game element with options
     */

    refreshLists() {
        for (var element in this.gameElements) {
            this.renderOptions(this.gameElements[element].options, $('.content', this.gameElements[element].container), this.renderElementOption );
        }
    }

    prepopulate(list, csv) {
        return $(list).val(csv);
    }


    buildList(element, csvElement) {
        return csvElement.val()
            .split(',')
            .map(function(t){ return t.trim(); })
            .map(function(name) {
                return {
                    'name' : name,
                    'element' : element,
                    'score' : 0,
                    'responses' : []
                };
            });
    }

    /*
     * Set up the option for a particular game element.
     * Then render that game element
     */

    setUpGameElement(element, renderer) {
        this.gameElements[element].options = this.buildList(element, $(this.gameElements[element].editList));
        this.renderOptions(this.gameElements[element].options, $('.content', this.gameElements[element].container), this.renderElementOption );
        $(this.gameElements[element].container).show();
    }


    /*
     * Render each of the game options
     */

    renderOptions(options, container, renderer) {
        $(container).empty();
        for(var index = 0; index < options.length; index++) {
            if (options[index] != null) {
                $(container).append(
                    `<div class="game-element-details">
                        ${ renderer(options[index]) }
                     <div>`
                 );
            }
        }
    }

    /*
     * Render the response to each game option
     */

    renderResponseOptions(option) {
        return `<div class="response-element" data-element="${option.element}" data-option="${option.name}">
                    ${option.name}
                    <div>
                        <button class="response-button selected">Yes</button>
                        <button class="response-button">No</button>
                        <button class="response-button">Shown to me</button>
                    </div>
                </div>`;
    }

    /*
     * Render the game element option
     */

    renderElementOption(option) {
        return `
            <div class="game-element option ${option.element}" data-element="${option.element}" data-option="${option.name}">
                ${option.name}
            </div>
            <span class="score">score : [${option.score}]</span>
            `;
    }

    /*
     * render option that was Shown
     */

    renderElementShownOption(option) {
        return `<div class="game-element option-shown" data-element="${option.element}" data-option="${option.name}">${option.name}</div>`;
    }


};

pico.Game = new pico.Game();
