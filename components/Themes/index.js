import React from 'react'
import dynamic from 'next/dynamic'

import Dropdown from '../Dropdown'
import { managePopout } from '../Popout'
import ThemeIcon from '../svg/Theme'
import RemoveIcon from '../svg/Remove'
import { THEMES, COLORS, DEFAULT_THEME } from '../../lib/constants'
import { getThemes, saveThemes, stringifyRGBA, generateId } from '../../lib/util'

const ThemeCreate = dynamic(() => import('./ThemeCreate'), {
  loading: () => null
})

const ThemeItem = ({ children, item, isSelected, onClick }) => (
  <div className="theme-item">
    {children}
    {item.custom && !isSelected && (
      <div role="button" tabIndex={0} className="icon" onClick={onClick(item.id)}>
        <RemoveIcon color={COLORS.SECONDARY} />
      </div>
    )}
    <style jsx>
      {`
        .theme-item {
          display: flex;
          flex: 1;
          justify-content: ${item.id === 'create' ? 'center' : 'space-between'};
          align-items: center;
        }

        .icon {
          display: flex;
          margin-right: 6px;
        }
      `}
    </style>
  </div>
)

const themeIcon = <ThemeIcon />

const getCustomName = themes =>
  `Custom Theme ${themes.filter(({ name }) => name.startsWith('Custom Theme')).length + 1}`

class Themes extends React.PureComponent {
  selectedTheme = DEFAULT_THEME

  state = {
    themes: THEMES,
    preset: this.props.theme,
    name: 'Custom Theme',
    selected: null
  }

  dropdown = React.createRef()

  componentDidMount() {
    const storedThemes = getThemes(localStorage) || []

    this.setState(({ themes }) => {
      const newThemes = [...storedThemes, ...themes]

      const name = getCustomName(newThemes)

      this.selectedTheme = newThemes.find(({ id }) => id === this.props.theme) || DEFAULT_THEME

      if (Object.keys(this.props.highlights).length === 0) {
        this.props.updateHighlights(this.selectedTheme.highlights)
      }

      return {
        themes: newThemes,
        name
      }
    })
  }

  componentDidUpdate(prevProps) {
    const { isVisible, theme, updateHighlights } = this.props
    const { themes } = this.state

    if (prevProps.isVisible && !isVisible) {
      this.setState({ name: getCustomName(themes) })
      updateHighlights(themes.find(({ id }) => id === theme).highlights)
    }
  }

  applyPreset = preset => {
    this.setState(({ themes }) => {
      this.props.updateHighlights(themes.find(({ id }) => id === preset).highlights)
      return {
        preset
      }
    })
  }

  handleChange = ({ id }) => {
    const { toggleVisibility, updateTheme, updateHighlights } = this.props
    const { themes } = this.state

    if (id === 'create') {
      toggleVisibility()
      this.dropdown.current.closeMenu()
    } else {
      updateTheme(id)
      updateHighlights(themes.find(theme => theme.id === id).highlights)
    }
  }

  updateName = ({ target: { value: name } }) => this.setState({ name })

  selectHighlight = highlight => () =>
    this.setState(({ selected }) => ({
      selected: selected === highlight ? null : highlight
    }))

  updateHighlight = ({ rgb }) =>
    this.props.updateHighlights({
      ...this.props.highlights,
      [this.state.selected]: stringifyRGBA(rgb)
    })

  removeTheme = id => event => {
    const { themes } = this.state
    const { theme, updateHighlights, updateTheme } = this.props

    event.stopPropagation()

    const newThemes = themes.filter(t => t.id !== id)

    saveThemes(localStorage, newThemes.filter(({ custom }) => custom))

    if (theme === id) {
      updateTheme(DEFAULT_THEME.id)
      updateHighlights(DEFAULT_THEME.highlights)
    } else {
      this.setState({ themes: newThemes })
    }
  }

  createTheme = () => {
    const { highlights, updateTheme } = this.props
    const { themes, name } = this.state

    const id = `theme:${generateId()}`

    const newTheme = {
      id,
      name,
      highlights,
      custom: true
    }

    const customThemes = [newTheme, ...themes.filter(({ custom }) => custom)]

    saveThemes(localStorage, customThemes)

    updateTheme(id)
  }

  itemWrapper = props => <ThemeItem {...props} onClick={this.removeTheme} />

  render() {
    const { theme, isVisible, toggleVisibility, highlights } = this.props
    const { name, themes, selected, preset } = this.state

    const dropdownValue = isVisible ? { name } : { id: theme, name: this.selectedTheme.name }

    const dropdownList = [
      {
        id: 'create',
        name: 'Create +'
      },
      ...themes
    ]

    return (
      <div className="themes">
        <Dropdown
          innerRef={this.dropdown}
          icon={themeIcon}
          disableInput={isVisible}
          inputValue={dropdownValue}
          selected={dropdownValue}
          list={dropdownList}
          itemWrapper={this.itemWrapper}
          onChange={this.handleChange}
          onOpen={isVisible && toggleVisibility}
        />
        {isVisible && (
          <ThemeCreate
            key={theme}
            preset={preset}
            name={name}
            theme={theme}
            themes={themes}
            highlights={highlights}
            selected={selected}
            applyPreset={this.applyPreset}
            createTheme={this.createTheme}
            updateName={this.updateName}
            selectHighlight={this.selectHighlight}
            updateHighlight={this.updateHighlight}
          />
        )}
        <style jsx>
          {`
            .themes {
              position: relative;
            }

            :global(.CodeMirror__container .CodeMirror) {
              color: ${highlights.text} !important;
              background-color: ${highlights.background} !important;
            }

            :global(.cm-string),
            :global(.cm-string-2) {
              color: ${highlights.string} !important;
            }
            :global(.cm-comment) {
              color: ${highlights.comment} !important;
            }
            :global(.cm-variable),
            :global(.cm-variable-2),
            :global(.cm-variable-3) {
              color: ${highlights.variable} !important;
            }
            :global(.cm-number) {
              color: ${highlights.number} !important;
            }
            :global(.cm-keyword) {
              color: ${highlights.keyword} !important;
            }
            :global(.cm-property) {
              color: ${highlights.property} !important;
            }
            :global(.cm-def) {
              color: ${highlights.definition} !important;
            }
            :global(.cm-meta) {
              color: ${highlights.meta} !important;
            }
            :global(.cm-operator) {
              color: ${highlights.operator} !important;
            }
            :global(.cm-attribute) {
              color: ${highlights.attribute} !important;
            }

            :global(.cm-s-dracula .CodeMirror-cursor) {
              border-left: solid 2px #159588 !important;
            }

            :global(.cm-s-solarized) {
              box-shadow: none !important;
            }

            :global(.cm-s-solarized.cm-s-light) {
              text-shadow: #eee8d5 0 1px !important;
            }

            :global(.cm-s-solarized.cm-s-light .CodeMirror-linenumber),
            :global(.cm-s-solarized.cm-s-light .CodeMirror-linenumbers) {
              background-color: #fdf6e3 !important;
            }

            :global(.cm-s-solarized.cm-s-dark .CodeMirror-linenumber),
            :global(.cm-s-solarized.cm-s-dark .CodeMirror-linenumbers) {
              background-color: #002b36 !important;
            }
          `}
        </style>
      </div>
    )
  }
}

export default managePopout(Themes)
