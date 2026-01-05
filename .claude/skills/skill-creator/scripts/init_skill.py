#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill directory with template files

Usage:
    python scripts/init_skill.py <skill-name> --path <output-directory>

Example:
    python scripts/init_skill.py my-new-skill --path .claude/skills
"""

import sys
import os
import re
import argparse
from pathlib import Path


SKILL_MD_TEMPLATE = '''---
name: {skill_name}
description: TODO - Describe when this skill should be used. Use third-person (e.g. "This skill should be used when...")
---

# {skill_title}

TODO: Describe the purpose of this skill in a few sentences.

## When to Use This Skill

TODO: List the scenarios when this skill should be triggered.

- Example trigger 1
- Example trigger 2

## Instructions

TODO: Provide step-by-step instructions for how Claude should use this skill.

### Step 1: [First Step]

TODO: Describe the first step.

### Step 2: [Second Step]

TODO: Describe the second step.

## Resources

### Scripts

- `scripts/example.py` - TODO: Describe what this script does (delete if not needed)

### References

- `references/example.md` - TODO: Describe reference material (delete if not needed)

### Assets

- `assets/` - TODO: Describe any assets (delete if not needed)
'''

EXAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""
Example script for {skill_name}

Delete this file if not needed for your skill.
"""

def main():
    print("Hello from {skill_name}!")

if __name__ == "__main__":
    main()
'''

EXAMPLE_REFERENCE = '''# Example Reference

This is an example reference file for the {skill_name} skill.

Delete this file if not needed for your skill.

## Usage

Add your reference documentation here. This could include:
- API documentation
- Database schemas
- Company policies
- Domain knowledge
'''


def validate_skill_name(name):
    """Validate skill name follows hyphen-case convention"""
    if not re.match(r'^[a-z0-9-]+$', name):
        return False, "Name should be hyphen-case (lowercase letters, digits, and hyphens only)"
    if name.startswith('-') or name.endswith('-') or '--' in name:
        return False, "Name cannot start/end with hyphen or contain consecutive hyphens"
    if len(name) > 40:
        return False, "Name should be 40 characters or fewer"
    return True, "Valid"


def init_skill(skill_name, output_path):
    """
    Initialize a new skill directory with template files.

    Args:
        skill_name: The name of the skill (hyphen-case)
        output_path: The directory where the skill folder will be created

    Returns:
        Path to the created skill directory, or None if error
    """
    # Validate skill name
    valid, message = validate_skill_name(skill_name)
    if not valid:
        print(f"Error: Invalid skill name '{skill_name}': {message}")
        return None

    output_path = Path(output_path).resolve()
    skill_path = output_path / skill_name

    # Check if skill already exists
    if skill_path.exists():
        print(f"Error: Skill directory already exists: {skill_path}")
        return None

    # Create skill directory structure
    try:
        skill_path.mkdir(parents=True, exist_ok=True)
        (skill_path / 'scripts').mkdir()
        (skill_path / 'references').mkdir()
        (skill_path / 'assets').mkdir()

        # Convert skill name to title
        skill_title = skill_name.replace('-', ' ').title()

        # Create SKILL.md
        skill_md_content = SKILL_MD_TEMPLATE.format(
            skill_name=skill_name,
            skill_title=skill_title
        )
        (skill_path / 'SKILL.md').write_text(skill_md_content)

        # Create example script
        example_script = EXAMPLE_SCRIPT.format(skill_name=skill_name)
        (skill_path / 'scripts' / 'example.py').write_text(example_script)

        # Create example reference
        example_ref = EXAMPLE_REFERENCE.format(skill_name=skill_name)
        (skill_path / 'references' / 'example.md').write_text(example_ref)

        # Create .gitkeep in assets
        (skill_path / 'assets' / '.gitkeep').write_text('')

        print(f"Successfully created skill at: {skill_path}")
        print()
        print("Next steps:")
        print(f"  1. Edit {skill_path / 'SKILL.md'} - Replace TODO sections with your content")
        print(f"  2. Add scripts to {skill_path / 'scripts'}/")
        print(f"  3. Add references to {skill_path / 'references'}/")
        print(f"  4. Add assets to {skill_path / 'assets'}/")
        print("  5. Delete any example files you don't need")

        return skill_path

    except Exception as e:
        print(f"Error creating skill: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description='Initialize a new skill directory with template files'
    )
    parser.add_argument('skill_name', help='Name of the skill (hyphen-case, e.g., my-new-skill)')
    parser.add_argument('--path', required=True, help='Output directory for the skill folder')

    args = parser.parse_args()

    result = init_skill(args.skill_name, args.path)

    if result:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
